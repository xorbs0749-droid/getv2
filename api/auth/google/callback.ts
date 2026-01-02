import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OAuth2Client } from 'google-auth-library';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/schema';
import { users } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://getv2.vercel.app/api/auth/google/callback';
const DATABASE_URL = process.env.DATABASE_URL || '';

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

    // 데이터베이스 연결
    const client = postgres(DATABASE_URL);
    const db = drizzle(client, { schema });

    // 사용자 DB에 저장
    const openId = `google:${userInfo.id}`;
    
    const existingUser = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    
    if (existingUser.length === 0) {
      await db.insert(users).values({
        openId,
        name: userInfo.name || null,
        email: userInfo.email || null,
        loginMethod: 'google',
        lastSignedIn: new Date(),
      });
    } else {
      await db.update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.openId, openId));
    }

    await client.end();

    // 간단한 세션 토큰 생성 (임시)
    const sessionToken = Buffer.from(JSON.stringify({
      openId,
      name: userInfo.name,
      email: userInfo.email,
      exp: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1년
    })).toString('base64');

    // 쿠키 설정
    res.setHeader('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`);

    // 홈으로 리다이렉트
    res.redirect(302, '/');
  } catch (error) {
    console.error('[Google OAuth] Callback failed', error);
    res.status(500).json({ error: 'Google OAuth callback failed', details: String(error) });
  }
}
