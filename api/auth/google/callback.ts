import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../../../lib/db';
import { users, accounts, sessions } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://getv2.vercel.app/api/auth/google/callback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    console.log('[OAuth] Starting callback with code:', code.substring(0, 10) + '...');
    
    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    console.log('[OAuth] Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('[OAuth] Fetching user info...');
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await response.json();
    console.log('[OAuth] User info:', userInfo.email);

    let userId: number;
    
    console.log('[OAuth] Checking existing user...');
    const existingUsers = await db.select().from(users).where(eq(users.email, userInfo.email)).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('[OAuth] Creating new user...');
      const newUsers = await db.insert(users).values({
        name: userInfo.name || null,
        email: userInfo.email || null,
        image: userInfo.picture || null,
        emailVerified: new Date(),
      }).returning();
      
      userId = newUsers[0].id;
      console.log('[OAuth] New user created:', userId);
      
      console.log('[OAuth] Creating account record...');
      await db.insert(accounts).values({
        userId,
        type: 'oauth',
        provider: 'google',
        providerAccountId: userInfo.id,
        access_token: tokens.access_token || null,
        refresh_token: tokens.refresh_token || null,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
        token_type: tokens.token_type || null,
        scope: tokens.scope || null,
        id_token: tokens.id_token || null,
      });
    } else {
      userId = existingUsers[0].id;
      console.log('[OAuth] Existing user found:', userId);
      
      await db.update(users)
        .set({ 
          updatedAt: new Date(),
          image: userInfo.picture || null,
        })
        .where(eq(users.id, userId));
    }

    console.log('[OAuth] Creating session...');
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      sessionToken,
      userId,
      expires,
    });

    console.log('[OAuth] Setting cookie and redirecting...');
    res.setHeader('Set-Cookie', `next-auth.session-token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
    return res.redirect(302, '/home');
  } catch (error) {
    console.error('[OAuth] Callback failed:', error);
    console.error('[OAuth] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return res.status(500).json({ 
      error: 'Google OAuth callback failed', 
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
