import mysql from 'mysql2/promise';

// 기존 프로젝트의 데이터베이스 URL
const oldDbUrl = 'mysql://ZiJeu2EYNRynNwv.root:GIC7I958OAz9TfZZB4He@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/keU6RoLXGvssxezrz8BdMX?ssl={"rejectUnauthorized":true}';

console.log('🔍 Connecting to old project database...');

async function extractData() {
  let connection;
  
  try {
    // 기존 데이터베이스 연결
    connection = await mysql.createConnection(oldDbUrl);
    console.log('✅ Connected to old database');

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

    // storagePacks 테이블 데이터 추출
    console.log('\n📦 Extracting storage packs...');
    const [storagePacks] = await connection.execute('SELECT * FROM storagePacks ORDER BY id');
    console.log(`Found ${storagePacks.length} storage packs`);

    // emailSubscriptions 테이블 데이터 추출
    console.log('\n📧 Extracting email subscriptions...');
    const [emailSubscriptions] = await connection.execute('SELECT * FROM emailSubscriptions ORDER BY id');
    console.log(`Found ${emailSubscriptions.length} email subscriptions`);

    // trackStats 테이블 데이터 추출
    console.log('\n📈 Extracting track stats...');
    const [trackStats] = await connection.execute('SELECT * FROM trackStats ORDER BY id');
    console.log(`Found ${trackStats.length} track stats`);

    // 데이터 저장
    const data = {
      categories,
      tracks,
      savedTracks,
      boardPosts,
      boardComments,
      storagePacks,
      emailSubscriptions,
      trackStats,
      extractedAt: new Date().toISOString()
    };

    // JSON 파일로 저장
    const fs = await import('fs');
    await fs.promises.writeFile(
      '/home/ubuntu/getspark/old-project-data.json',
      JSON.stringify(data, null, 2)
    );
    
    console.log('\n✅ Data extracted successfully!');
    console.log('📁 Saved to: /home/ubuntu/getspark/old-project-data.json');
    
    // 요약 출력
    console.log('\n📊 Summary:');
    console.log(`  - Categories: ${categories.length}`);
    console.log(`  - Tracks: ${tracks.length}`);
    console.log(`  - Saved Tracks: ${savedTracks.length}`);
    console.log(`  - Board Posts: ${boardPosts.length}`);
    console.log(`  - Board Comments: ${boardComments.length}`);
    console.log(`  - Storage Packs: ${storagePacks.length}`);
    console.log(`  - Email Subscriptions: ${emailSubscriptions.length}`);
    console.log(`  - Track Stats: ${trackStats.length}`);

    // 카테고리 목록 출력
    if (categories.length > 0) {
      console.log('\n📂 Categories:');
      categories.forEach(cat => {
        console.log(`  - [${cat.id}] ${cat.name} (${cat.type})`);
        console.log(`    Image: ${cat.imageUrl || 'no image'}`);
      });
    }

    // 트랙 샘플 출력
    if (tracks.length > 0) {
      console.log('\n🎵 Sample tracks:');
      tracks.slice(0, 10).forEach(track => {
        console.log(`  - [${track.id}] ${track.title} by ${track.artist || 'Unknown'}`);
        console.log(`    Category: ${track.categoryId}`);
        console.log(`    URL: ${track.audioUrl}`);
      });
      if (tracks.length > 10) {
        console.log(`  ... and ${tracks.length - 10} more tracks`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

extractData();
