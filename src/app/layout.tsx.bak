// src/app/layout.tsx
import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'
import './globals.css'

export const metadata: Metadata = {
  title:       'LearnQuest LMS',
  description: 'Gamified Learning Management System',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch session server-side and pass it to SessionProvider
  // This prevents the useSession undefined error during build
  const session = await auth()

  return (
    <html lang="en">
      <body className="bg-[#06060f] text-white">
        <SessionProvider session={session}>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}