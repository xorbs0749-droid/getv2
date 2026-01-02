import { db } from './lib/db';
import { users } from './drizzle/schema';

async function test() {
  try {
    console.log('Testing database connection...');
    const result = await db.select().from(users).limit(1);
    console.log('✅ Database connection successful!');
    console.log('Users count:', result.length);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

test();
