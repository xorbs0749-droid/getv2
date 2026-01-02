import { OAuth2Client } from 'google-auth-library';
import type { Express, Request, Response } from 'express';
import * as db from '../db';
import { COOKIE_NAME, ONE_YEAR_MS } from '@shared/const';
import { getSessionCookieOptions } from './cookies';
import { sdk } from './sdk';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://getv2.vercel.app/api/auth/google/callback';

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

export function registerGoogleOAuthRoutes(app: Express) {
  // Google OAuth 시작
  app.get('/api/auth/google', (req: Request, res: Response) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'consent',
    });
    res.redirect(authUrl);
  });

  // Google OAuth 콜백
  app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    try {
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

      // 사용자 DB에 저장
      const openId = `google:${userInfo.id}`;
      await db.upsertUser({
        openId,
        name: userInfo.name || null,
        email: userInfo.email || null,
        loginMethod: 'google',
        lastSignedIn: new Date(),
      });

      // 세션 토큰 생성
      const sessionToken = await sdk.createSessionToken(openId, {
        name: userInfo.name || '',
        expiresInMs: ONE_YEAR_MS,
      });

      // 쿠키 설정
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // 홈으로 리다이렉트
      res.redirect('/');
    } catch (error) {
      console.error('[Google OAuth] Callback failed', error);
      res.status(500).json({ error: 'Google OAuth callback failed' });
    }
  });
}
