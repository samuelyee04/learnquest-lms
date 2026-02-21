'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#06060f] flex flex-col items-center justify-center text-white px-4">
      <div className="text-7xl mb-6">⚠️</div>
      <h1 className="font-mono font-black text-3xl mb-2">Something went wrong</h1>
      <p className="font-mono text-white/40 text-sm mb-8 max-w-md text-center">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#06060f] font-bold font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
      >
        Try Again
      </button>
    </div>
  )
}
