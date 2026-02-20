'use client'
// src/components/ui/Toast.tsx

import { useEffect } from 'react'

interface Props {
  message: string
  onDone:  () => void
  duration?: number
}

export default function Toast({ message, onDone, duration = 3000 }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [onDone, duration])

  return (
    <div
      className="fixed bottom-7 right-7 z-[9999] px-6 py-4 rounded-xl font-mono font-bold text-sm text-[#0a0a14] shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #00f5d4, #4cc9f0)',
        boxShadow: '0 8px 32px rgba(0,245,212,.4)',
        animation: 'slideUp .3s cubic-bezier(.34,1.56,.64,1)',
      }}
    >
      {message}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}