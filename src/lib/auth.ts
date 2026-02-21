import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter:  PrismaAdapter(prisma),
  session:  { strategy: 'jwt' },
  secret:   process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return {
          id:       user.id,
          name:     user.name,
          email:    user.email,
          role:     user.role,
          xpPoints: user.xpPoints,
          level:    user.level,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id
        token.role     = (user as any).role
        token.xpPoints = (user as any).xpPoints
        token.level    = (user as any).level
      }
      return token
    },
    async session({ session, token }) {
      session.user.id       = token.id       as string
      session.user.role     = token.role     as string
      session.user.xpPoints = token.xpPoints as number
      session.user.level    = token.level    as number
      return session
    },
  },
})
