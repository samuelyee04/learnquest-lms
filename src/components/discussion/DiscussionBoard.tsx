'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Discussion } from '@/types'
import { getSocket } from '@/lib/socket'

interface Props {
  programId: string
  catColor:  string
  isAdmin?:  boolean
  onCleared?: () => void
}

const POLL_INTERVAL_MS = 4000

export default function DiscussionBoard({ programId, catColor, isAdmin = false, onCleared }: Props) {
  const { data: session }         = useSession()
  const [messages, setMessages]   = useState<Discussion[]>([])
  const [newMsg, setNewMsg]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const [connected, setConnected]  = useState(false)
  const [clearing, setClearing]   = useState(false)
  const bottomRef                  = useRef<HTMLDivElement>(null)

  const loadMessages = () =>
    fetch(`/api/discussion?programId=${programId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setMessages(data) })
      .catch(console.error)

  useEffect(() => {
    loadMessages().finally(() => setLoading(false))
  }, [programId])

  // Poll when socket is not connected so updates show without switching tabs
  useEffect(() => {
    if (connected) return
    const t = setInterval(loadMessages, POLL_INTERVAL_MS)
    return () => clearInterval(t)
  }, [programId, connected])

  // ── Connect Socket.io and join program room ───────────────────────────────
  useEffect(() => {
    const socket = getSocket()
    socket.emit('join-program', programId)
    setConnected(socket.connected)

    socket.on('message', (data: Discussion) => {
      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev
        return [...prev, data]
      })
    })
    socket.on('message-liked', ({ messageId }: { messageId: string }) => {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, likes: m.likes + 1 } : m)
      )
    })
    socket.on('connect',    () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    return () => {
      socket.emit('leave-program', programId)
      socket.off('message')
      socket.off('message-liked')
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [programId])

  // ── Auto scroll to bottom on new messages ────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send a new message ────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMsg.trim() || sending || !session?.user) return

    setSending(true)
    const text = newMsg.trim()
    setNewMsg('')

    try {
      // 1. Save to database via API
      const res = await fetch('/api/discussion', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ programId, message: text }),
      })
      const saved: Discussion | { error: string } = await res.json()

      if ('error' in saved) throw new Error(saved.error)

      // 2. Add to local state immediately (optimistic)
      setMessages(prev => [...prev, saved])

      // 3. Broadcast to other users via Socket.io
      const socket = getSocket()
      socket.emit('new-message', saved)

    } catch (err) {
      console.error('[DISCUSSION_SEND]', err)
      // Restore the message text if sending failed
      setNewMsg(text)
    } finally {
      setSending(false)
    }
  }

  // ── Like a message ────────────────────────────────────────────────────────
  const handleLike = async (messageId: string) => {
    // Optimistic update
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, likes: m.likes + 1 } : m)
    )

    try {
      await fetch(`/api/discussion/${messageId}/like`, { method: 'POST' })

      // Broadcast like to room
      const socket = getSocket()
      socket.emit('like-message', { messageId, programId })
    } catch (err) {
      console.error('[DISCUSSION_LIKE]', err)
      // Revert optimistic update on error
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, likes: m.likes - 1 } : m)
      )
    }
  }

  const formatTime = (dateStr: string) => {
    const diff  = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days  = Math.floor(hours / 24)
    if (mins < 1)   return 'just now'
    if (mins < 60)  return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Live / status indicator */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-amber-400/80'}`}
            style={connected ? { boxShadow: '0 0 6px #4ade80' } : {}}
          />
          <span className="font-mono text-xs text-white/30">
            {connected ? 'Live' : 'Connecting… (updates every few seconds)'}
          </span>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm('Clear all messages in this discussion? This cannot be undone.')) return
              setClearing(true)
              try {
                const res = await fetch(`/api/discussion?programId=${programId}`, { method: 'DELETE' })
                if (res.ok) {
                  setMessages([])
                  onCleared?.()
                }
              } catch (e) {
                console.error(e)
              } finally {
                setClearing(false)
              }
            }}
            disabled={clearing || messages.length === 0}
            className="font-mono text-xs text-white/40 hover:text-red-400 disabled:opacity-40"
          >
            {clearing ? 'Clearing…' : 'Clear discussion'}
          </button>
        )}
      </div>

      {/* Message input */}
      <div className="flex gap-3">
        <input
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Share a thought, ask a question..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono outline-none placeholder:text-white/25 focus:border-white/20 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!newMsg.trim() || sending}
          className="px-5 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-widest text-[#0a0a14] transition-all hover:opacity-90 active:scale-95 disabled:opacity-30"
          style={{ background: `linear-gradient(135deg, ${catColor}, #4cc9f0)` }}
        >
          {sending ? '...' : 'Post'}
        </button>
      </div>

      {/* Messages list */}
      <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-hide">
        {loading && (
          <div className="text-center py-10 text-white/25 font-mono text-xs">
            Loading discussion...
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-10 text-white/25 font-mono text-xs">
            No messages yet. Be the first to post! 💬
          </div>
        )}

        {messages.map(msg => {
          const isOwn    = msg.userId === session?.user?.id
          const initials = msg.user.name.slice(0, 2).toUpperCase()

          return (
            <div
              key={msg.id}
              className="flex gap-3 py-4 border-b border-white/5 last:border-0"
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-mono font-black text-xs text-[#0a0a14]"
                style={{ background: `linear-gradient(135deg, ${catColor}, #4cc9f0)` }}
              >
                {msg.user.avatar
                  ? <img src={msg.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  : initials
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xs text-white">
                    {msg.user.name}
                    {isOwn && (
                      <span className="ml-1.5 text-white/25 font-normal text-xs">(you)</span>
                    )}
                  </span>
                  <span className="font-mono text-xs text-white/25">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className="font-mono text-xs text-white/60 leading-relaxed break-words">
                  {msg.message}
                </p>
              </div>

              {/* Like button */}
              <button
                onClick={() => handleLike(msg.id)}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs font-mono text-white/25 hover:text-red-400 transition-colors self-start mt-0.5"
              >
                ❤️ {msg.likes}
              </button>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}