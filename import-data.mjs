import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import fs from 'fs';

// 환경 변수 로드
config();

const newDbUrl = process.env.DATABASE_URL;

if (!newDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

console.log('📖 Reading extracted data...');
const data = JSON.parse(fs.readFileSync('/home/ubuntu/getspark/old-project-data.json', 'utf8'));

console.log(`Found ${data.categories.length} categories, ${data.tracks.length} tracks`);

async function importData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(newDbUrl);
    console.log('✅ Connected to new database');

    // 1. Categories 삽입
    console.log('\n📂 Importing categories...');
    for (const cat of data.categories) {
      try {
        await connection.execute(
          `INSERT INTO categories (id, name, type, imageUrl, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           name = VALUES(name), 
           type = VALUES(type), 
           imageUrl = VALUES(imageUrl),
           updatedAt = VALUES(updatedAt)`,
          [cat.id, cat.name, cat.type, cat.imageUrl, cat.createdAt, cat.updatedAt]
        );
        console.log(`  ✓ ${cat.name} (${cat.type})`);
      } catch (error) {
        console.error(`  ✗ Failed to import category ${cat.name}:`, error.message);
      }
    }

    // 2. Tracks 삽입
    console.log('\n🎵 Importing tracks...');
    let successCount = 0;
    for (const track of data.tracks) {
      try {
        await connection.execute(
          `INSERT INTO tracks (id, title, artist, audioUrl, fileKey, fileSize, categoryId, uploadedBy, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           title = VALUES(title),
           artist = VALUES(artist),
           audioUrl = VALUES(audioUrl),
           fileKey = VALUES(fileKey),
           fileSize = VALUES(fileSize),
           categoryId = VALUES(categoryId),
           uploadedBy = VALUES(uploadedBy),
           updatedAt = VALUES(updatedAt)`,
          [
            track.id,
            track.title,
            track.artist,
            track.audioUrl,
            track.fileKey,
            track.fileSize,
            track.categoryId,
            track.uploadedBy,
            track.createdAt,
            track.updatedAt
          ]
        );
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`  ✓ Imported ${successCount}/${data.tracks.length} tracks...`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to import track ${track.title}:`, error.message);
      }
    }
    console.log(`  ✓ Total: ${successCount}/${data.tracks.length} tracks imported`);

    // 3. Board Posts 삽입
    if (data.boardPosts.length > 0) {
      console.log('\n📝 Importing board posts...');
      for (const post of data.boardPosts) {
        try {
          await connection.execute(
            `INSERT INTO boardPosts (id, title, content, authorId, viewCount, isNotice, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             title = VALUES(title),
             content = VALUES(content),
             viewCount = VALUES(viewCount),
             isNotice = VALUES(isNotice),
             updatedAt = VALUES(updatedAt)`,
            [
              post.id,
              post.title,
              post.content,
              post.authorId,
              post.viewCount,
              post.isNotice,
              post.createdAt,
              post.updatedAt
            ]
          );
          console.log(`  ✓ ${post.title}`);
        } catch (error) {
          console.error(`  ✗ Failed to import post ${post.title}:`, error.message);
        }
      }
    }

    // 4. Board Comments 삽입
    if (data.boardComments.length > 0) {
      console.log('\n💬 Importing board comments...');
      let commentCount = 0;
      for (const comment of data.boardComments) {
        try {
          await connection.execute(
            `INSERT INTO boardComments (id, postId, content, authorId, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             content = VALUES(content),
             updatedAt = VALUES(updatedAt)`,
            [
              comment.id,
              comment.postId,
              comment.content,
              comment.authorId,
              comment.createdAt,
              comment.updatedAt
            ]
          );
          commentCount++;
        } catch (error) {
          console.error(`  ✗ Failed to import comment:`, error.message);
        }
      }
      console.log(`  ✓ Imported ${commentCount} comments`);
    }

    // 5. Email Subscriptions 삽입
    if (data.emailSubscriptions.length > 0) {
      console.log('\n📧 Importing email subscriptions...');
      for (const sub of data.emailSubscriptions) {
        try {
          await connection.execute(
            `INSERT INTO emailSubscriptions (id, email, createdAt) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE email = VALUES(email)`,
            [sub.id, sub.email, sub.createdAt]
          );
          console.log(`  ✓ ${sub.email}`);
        } catch (error) {
          console.error(`  ✗ Failed to import subscription:`, error.message);
        }
      }
    }

    // 6. Track Stats 삽입
    if (data.trackStats.length > 0) {
      console.log('\n📈 Importing track stats...');
      for (const stat of data.trackStats) {
        try {
          await connection.execute(
            `INSERT INTO trackStats (id, trackId, playCount, lastPlayedAt, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             playCount = VALUES(playCount),
             lastPlayedAt = VALUES(lastPlayedAt),
             updatedAt = VALUES(updatedAt)`,
            [
              stat.id,
              stat.trackId,
              stat.playCount,
              stat.lastPlayedAt,
              stat.createdAt,
              stat.updatedAt
            ]
          );
        } catch (error) {
          console.error(`  ✗ Failed to import stat:`, error.message);
        }
      }
      console.log(`  ✓ Imported ${data.trackStats.length} stats`);
    }

    console.log('\n✅ Data import completed!');
    console.log('\n📊 Final Summary:');
    console.log(`  - Categories: ${data.categories.length}`);
    console.log(`  - Tracks: ${successCount}/${data.tracks.length}`);
    console.log(`  - Board Posts: ${data.boardPosts.length}`);
    console.log(`  - Board Comments: ${data.boardComments.length}`);
    console.log(`  - Email Subscriptions: ${data.emailSubscriptions.length}`);
    console.log(`  - Track Stats: ${data.trackStats.length}`);

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

importData();
