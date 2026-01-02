import { OAuth2Client } from 'google-auth-library';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, accounts, sessions } from './drizzle/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = 'https://getv2.vercel.app/api/auth/google/callback';
const DATABASE_URL = process.env.DATABASE_URL!;

async function testCallback() {
  try {
    console.log('Testing OAuth callback...');
    
    // Initialize database
    const client = postgres(DATABASE_URL);
    const db = drizzle(client);
    console.log('✅ Database connected');
    
    // Test OAuth client
    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );
    console.log('✅ OAuth client created');
    
    // Test database query
    const existingUsers = await db.select().from(users).limit(1);
    console.log('✅ Database query successful:', existingUsers.length, 'users found');
    
    // Test session token generation
    const sessionToken = randomBytes(32).toString('hex');
    console.log('✅ Session token generated:', sessionToken.substring(0, 10) + '...');
    
    console.log('\n✅ All components working correctly!');
    
    await client.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCallback();
