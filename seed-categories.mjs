import { drizzle } from 'drizzle-orm/mysql2';
import { categories } from './drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL);

const sampleCategories = [
  // 장소
  { name: '카페', slug: 'cafe', type: 'place', description: '카페에서 듣기 좋은 음악', gradientFrom: '#8B4513', gradientTo: '#D2691E', order: 1 },
  { name: '라운지', slug: 'lounge', type: 'place', description: '라운지 분위기의 음악', gradientFrom: '#4B0082', gradientTo: '#8B008B', order: 2 },
  { name: '식당', slug: 'restaurant', type: 'place', description: '식사 시간에 어울리는 음악', gradientFrom: '#FF6347', gradientTo: '#FF8C00', order: 3 },
  
  // 상황
  { name: '집중', slug: 'focus', type: 'situation', description: '집중할 때 듣기 좋은 음악', gradientFrom: '#1E90FF', gradientTo: '#00BFFF', order: 1 },
  { name: '휴식', slug: 'relax', type: 'situation', description: '편안한 휴식을 위한 음악', gradientFrom: '#32CD32', gradientTo: '#00FA9A', order: 2 },
  { name: '운동', slug: 'workout', type: 'situation', description: '운동할 때 듣기 좋은 음악', gradientFrom: '#FF4500', gradientTo: '#FF6347', order: 3 },
  
  // 날씨
  { name: '맑음', slug: 'sunny', type: 'weather', description: '화창한 날씨에 어울리는 음악', gradientFrom: '#FFD700', gradientTo: '#FFA500', order: 1 },
  { name: '흐림', slug: 'cloudy', type: 'weather', description: '흐린 날씨에 어울리는 음악', gradientFrom: '#708090', gradientTo: '#A9A9A9', order: 2 },
  { name: '비', slug: 'rainy', type: 'weather', description: '비 오는 날 듣기 좋은 음악', gradientFrom: '#4682B4', gradientTo: '#5F9EA0', order: 3 },
  
  // 장르
  { name: '재즈', slug: 'jazz', type: 'special', description: '재즈 음악', gradientFrom: '#8B4513', gradientTo: '#A0522D', order: 1 },
  { name: '클래식', slug: 'classical', type: 'special', description: '클래식 음악', gradientFrom: '#2F4F4F', gradientTo: '#556B2F', order: 2 },
  { name: '어쿠스틱', slug: 'acoustic', type: 'special', description: '어쿠스틱 음악', gradientFrom: '#CD853F', gradientTo: '#DEB887', order: 3 },
];

async function seed() {
  console.log('Seeding categories...');
  
  for (const category of sampleCategories) {
    await db.insert(categories).values(category);
    console.log(`✓ ${category.name}`);
  }
  
  console.log('✅ Seeding completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
