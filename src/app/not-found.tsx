import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#06060f] flex flex-col items-center justify-center text-white px-4">
      <div className="text-7xl mb-6">🔍</div>
      <h1 className="font-mono font-black text-4xl mb-2">404</h1>
      <p className="font-mono text-white/40 text-sm mb-8">
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/explore"
        className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#06060f] font-bold font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
      >
        Go to Explore
      </Link>
    </div>
  )
}
