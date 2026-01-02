import { db } from './lib/db';
import { users } from './drizzle/schema';

async function test() {
  try {
    const result = await db.select().from(users).limit(1);
    console.log('✅ Success! Users:', result.length);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
