import { db } from './server/db.js';
import { categories } from './drizzle/schema.js';

const allCategories = await db.select().from(categories);
console.log(JSON.stringify(allCategories, null, 2));
process.exit(0);
