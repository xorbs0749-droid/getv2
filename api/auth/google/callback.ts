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
    res.status(400).json({ error: 'Authorization code is required' });
    return;
  }

  try {
    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    // 토큰 교환
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 사용자 정보 가져오기
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await response.json();

    // 사용자 DB에 저장 또는 업데이트
    let userId: number;
    
    const existingUsers = await db.select().from(users).where(eq(users.email, userInfo.email)).limit(1);
    
    if (existingUsers.length === 0) {
      // 새 사용자 생성
      const newUsers = await db.insert(users).values({
        name: userInfo.name || null,
        email: userInfo.email || null,
        image: userInfo.picture || null,
        emailVerified: new Date(),
      }).returning();
      
      userId = newUsers[0].id;
      
      // Account 레코드 생성
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
      
      // 기존 사용자 업데이트
      await db.update(users)
        .set({ 
          updatedAt: new Date(),
          image: userInfo.picture || null,
        })
        .where(eq(users.id, userId));
    }

    // 세션 생성
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일

    await db.insert(sessions).values({
      sessionToken,
      userId,
      expires,
    });

    // 쿠키 설정
    res.setHeader('Set-Cookie', `next-auth.session-token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);

    // 홈으로 리다이렉트
    res.redirect(302, '/home');
  } catch (error) {
    console.error('[Google OAuth] Callback failed', error);
    res.status(500).json({ error: 'Google OAuth callback failed', details: String(error) });
  }
}
