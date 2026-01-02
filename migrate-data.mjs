import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// 현재 프로젝트의 환경 변수 로드
config();

const currentDbUrl = process.env.DATABASE_URL;

if (!currentDbUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🔍 Connecting to current database...');
console.log('Database URL:', currentDbUrl.replace(/:[^:@]+@/, ':****@'));

async function extractData() {
  let connection;
  
  try {
    // 현재 데이터베이스 연결
    connection = await mysql.createConnection(currentDbUrl);
    console.log('✅ Connected to database');

    // categories 테이블 데이터 추출
    console.log('\n📊 Extracting categories...');
    const [categories] = await connection.execute('SELECT * FROM categories ORDER BY id');
    console.log(`Found ${categories.length} categories`);
    
    // tracks 테이블 데이터 추출
    console.log('\n🎵 Extracting tracks...');
    const [tracks] = await connection.execute('SELECT * FROM tracks ORDER BY id');
    console.log(`Found ${tracks.length} tracks`);

    // savedTracks 테이블 데이터 추출
    console.log('\n💾 Extracting saved tracks...');
    const [savedTracks] = await connection.execute('SELECT * FROM savedTracks ORDER BY id');
    console.log(`Found ${savedTracks.length} saved tracks`);

    // boardPosts 테이블 데이터 추출
    console.log('\n📝 Extracting board posts...');
    const [boardPosts] = await connection.execute('SELECT * FROM boardPosts ORDER BY id');
    console.log(`Found ${boardPosts.length} board posts`);

    // boardComments 테이블 데이터 추출
    console.log('\n💬 Extracting board comments...');
    const [boardComments] = await connection.execute('SELECT * FROM boardComments ORDER BY id');
    console.log(`Found ${boardComments.length} board comments`);

    // 데이터 저장
    const data = {
      categories,
      tracks,
      savedTracks,
      boardPosts,
      boardComments,
      extractedAt: new Date().toISOString()
    };

    // JSON 파일로 저장
    const fs = await import('fs');
    await fs.promises.writeFile(
      '/home/ubuntu/getspark/extracted-data.json',
      JSON.stringify(data, null, 2)
    );
    
    console.log('\n✅ Data extracted successfully!');
    console.log('📁 Saved to: /home/ubuntu/getspark/extracted-data.json');
    
    // 요약 출력
    console.log('\n📊 Summary:');
    console.log(`  - Categories: ${categories.length}`);
    console.log(`  - Tracks: ${tracks.length}`);
    console.log(`  - Saved Tracks: ${savedTracks.length}`);
    console.log(`  - Board Posts: ${boardPosts.length}`);
    console.log(`  - Board Comments: ${boardComments.length}`);

    // 카테고리 목록 출력
    if (categories.length > 0) {
      console.log('\n📂 Categories:');
      categories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.type}): ${cat.imageUrl || 'no image'}`);
      });
    }

    // 트랙 샘플 출력
    if (tracks.length > 0) {
      console.log('\n🎵 Sample tracks:');
      tracks.slice(0, 5).forEach(track => {
        console.log(`  - ${track.title} by ${track.artist || 'Unknown'}`);
        console.log(`    URL: ${track.audioUrl}`);
      });
      if (tracks.length > 5) {
        console.log(`  ... and ${tracks.length - 5} more tracks`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Database connection refused. Please check:');
      console.error('   - Database host and port are correct');
      console.error('   - Database server is running');
      console.error('   - Firewall allows connection');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Access denied. Please check:');
      console.error('   - Username and password are correct');
      console.error('   - User has permission to access the database');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Database not found. Please check:');
      console.error('   - Database name is correct');
      console.error('   - Database exists on the server');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

extractData();
