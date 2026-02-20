'use client'
// src/components/admin/AdminParticipants.tsx

import { useState, useEffect } from 'react'

interface Participant {
  id:       string
  progress: number
  completed: boolean
  enrolledAt: string
  user: {
    id:    string
    name:  string
    email: string
    avatar: string | null
  }
}

interface Props {
  programId: string
  catColor:  string
}

export default function AdminParticipants({ programId, catColor }: Props) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading]           = useState(true)
  const [removing, setRemoving]         = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/participants?programId=${programId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setParticipants(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [programId])

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this program?`)) return
    setRemoving(userId)
    try {
      await fetch(`/api/admin/participants`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, programId }),
      })
      setParticipants(prev => prev.filter(p => p.user.id !== userId))
    } catch (err) {
      console.error('[REMOVE_PARTICIPANT]', err)
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-10 text-white/25 font-mono text-xs">
        Loading participants...
      </div>
    )
  }

  if (participants.length === 0) {
    return (
      <div className="text-center py-10 text-white/25 font-mono text-xs">
        No participants enrolled yet.
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-mono font-bold text-white text-sm">
          👥 {participants.length} Participants
        </h3>
        <div className="text-xs font-mono text-white/35">
          {participants.filter(p => p.completed).length} completed
        </div>
      </div>

      <div className="space-y-3">
        {participants.map(p => {
          const initials = p.user.name.slice(0, 2).toUpperCase()
          return (
            <div
              key={p.id}
              className="flex items-center gap-4 p-4 bg-white/4 rounded-xl border border-white/6"
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-mono font-black text-xs text-[#0a0a14]"
                style={{ background: `linear-gradient(135deg, ${catColor}88, #4cc9f088)` }}
              >
                {initials}
              </div>

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-white text-xs truncate">{p.user.name}</p>
                <p className="font-mono text-white/35 text-xs truncate">{p.user.email}</p>
              </div>

              {/* Progress */}
              <div className="hidden sm:flex flex-col items-end gap-1.5 w-28">
                <span className="font-mono text-xs font-bold" style={{ color: catColor }}>
                  {p.progress}%
                  {p.completed && <span className="ml-1">✅</span>}
                </span>
                <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p.progress}%`, background: catColor }}
                  />
                </div>
              </div>

              {/* Remove button */}
              <button
                onClick={() => handleRemove(p.user.id, p.user.name)}
                disabled={removing === p.user.id}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-40"
                style={{
                  border: '1px solid rgba(247,37,133,.3)',
                  background: 'rgba(247,37,133,.08)',
                  color: '#f72585',
                }}
              >
                {removing === p.user.id ? '...' : 'Remove'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}