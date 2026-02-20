// src/app/(dashboard)/explore/page.tsx
import { Suspense } from 'react'
import ExploreClient from './ExploreClient'

// This wrapper lets Next.js prerender the shell
// while the client component loads dynamically
export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#06060f] flex items-center justify-center">
        <p className="text-white/30 font-mono text-sm">Loading...</p>
      </div>
    }>
      <ExploreClient />
    </Suspense>
  )
}