import type { VercelRequest, VercelResponse } from '@vercel/node';
import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '../../lib/db';

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  debug: true, // 디버깅 활성화
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await NextAuth(req, res, authOptions);
  } catch (error) {
    console.error('[NextAuth] Handler error:', error);
    res.status(500).json({ error: 'Authentication failed', details: String(error) });
  }
}
