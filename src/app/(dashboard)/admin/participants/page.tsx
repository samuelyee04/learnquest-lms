'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface ProgramOption {
  id: string
  title: string
  category: { icon: string; name: string; color: string }
}

interface Participant {
  id: string
  progress: number
  completed: boolean
  enrolledAt: string
  user: { id: string; name: string; email: string; avatar: string | null }
}

export default function AdminParticipantsPage() {
  const { data: session } = useSession()
  const [programs, setPrograms]           = useState<ProgramOption[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [participants, setParticipants]   = useState<Participant[]>([])
  const [loading, setLoading]             = useState(false)
  const [removing, setRemoving]           = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/programs')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPrograms(data) })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedProgram) {
      setParticipants([])
      return
    }
    setLoading(true)
    fetch(`/api/admin/participants?programId=${selectedProgram}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setParticipants(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedProgram])

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this program?`)) return
    setRemoving(userId)
    try {
      await fetch('/api/admin/participants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, programId: selectedProgram }),
      })
      setParticipants(prev => prev.filter(p => p.user.id !== userId))
    } catch (err) {
      console.error('[REMOVE_PARTICIPANT]', err)
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#06060f] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-mono font-black text-3xl text-white mb-2">Participants</h1>
        <p className="font-mono text-white/35 text-sm mb-8">View and manage enrolled students by program</p>

        <select
          value={selectedProgram}
          onChange={e => setSelectedProgram(e.target.value)}
          className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none mb-8"
        >
          <option value="">Select a program...</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.category?.icon} {p.title}</option>
          ))}
        </select>

        {!selectedProgram && (
          <div className="text-center py-20 text-white/25 font-mono">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-lg font-bold">Select a program</p>
            <p className="text-sm mt-1">Choose a program above to view its participants</p>
          </div>
        )}

        {selectedProgram && loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/4 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {selectedProgram && !loading && participants.length === 0 && (
          <div className="text-center py-20 text-white/25 font-mono">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg font-bold">No participants</p>
            <p className="text-sm mt-1">No one has enrolled in this program yet</p>
          </div>
        )}

        {selectedProgram && !loading && participants.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-5">
              <span className="font-mono font-bold text-white text-sm">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </span>
              <span className="font-mono text-white/35 text-xs">
                {participants.filter(p => p.completed).length} completed
              </span>
            </div>
            <div className="space-y-3">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-4 p-4 bg-white/4 rounded-xl border border-white/6">
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-mono font-black text-xs text-[#0a0a14] bg-gradient-to-br from-cyan-400 to-blue-500">
                    {p.user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-white text-xs truncate">{p.user.name}</p>
                    <p className="font-mono text-white/35 text-xs truncate">{p.user.email}</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1.5 w-28">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {p.progress}% {p.completed && '✅'}
                    </span>
                    <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(p.user.id, p.user.name)}
                    disabled={removing === p.user.id}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ border: '1px solid rgba(247,37,133,.3)', background: 'rgba(247,37,133,.08)', color: '#f72585' }}
                  >
                    {removing === p.user.id ? '...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
