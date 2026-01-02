# GetSpark 완전 복원 가이드

## 🚨 새 프로젝트(getspark_v2) 채팅에 이 내용을 복사해서 보내세요!

---

이전 getspark 프로젝트를 완전히 복원해줘. 다음 단계를 순서대로 실행해:

## 1단계: 백업 데이터 생성

먼저 다음 JSON 파일들을 생성해줘:

### categories_backup.json
파일 경로: `/tmp/categories_backup.json`

내용은 이전 프로젝트에서 `curl -s http://localhost:3000/api/trpc/categories.getAll` 결과를 저장한 것.
카테고리 28개 (카페, 라운지, 식당, 파티, 오피스, 로비, 스터디카페, 셀렉트샵, 드라이빙, 운동, 아침, 점심, 저녁, 맑음, 흐림, 비오는날, 눈오는날, 벚꽃, 단풍, 여름휴가, 크리스마스, 집중, 휴식, 어쿠스틱, 클래식, 시티팝, 국악퓨전, 파티)

### tracks_backup.json  
파일 경로: `/tmp/tracks_backup.json`

음악 트랙 126개. 각 카테고리당 3-6개씩.
S3 URL 형식: `https://getspark-music.s3.ap-northeast-2.amazonaws.com/...`

### board_backup.json
파일 경로: `/tmp/board_backup.json`

게시판 데이터.

## 2단계: 코드 파일 복원

다음 파일들을 복원해줘:

### client/src/pages/Home.tsx
- 메인 페이지
- 카테고리 카드 그리드 레이아웃
- 시간대별 배경 이미지

### client/src/components/MusicPlayer.tsx
- 음악 플레이어 컴포넌트
- Media Session API 통합
- 재생/일시정지/이전/다음 기능

### client/src/components/admin/TracksManager.tsx
- 음악 업로드 관리
- **파일 크기 제한: 500MB**
- S3 업로드 통합

### server/_core/index.ts
- Express 서버 설정
- **body-parser 제한: 500mb**

### drizzle/schema.ts
- 데이터베이스 스키마
- categories, tracks, savedTracks, boardPosts, boardComments 테이블

## 3단계: 이미지 파일 복원

### 카테고리 이미지 (client/public/categories/)
28개 이미지 파일 (각 256x256 PNG):
- cafe.png, lounge.png, restaurant.png, pub.png, office.png, lobby.png, study-cafe.png, select-shop.png
- driving.png, exercise.png, morning.png, lunch.png, evening.png
- sunny.png, cloudy.png, rainy.png, snowy.png
- cherry-blossom.png, autumn-leaves.png, summer-vacation.png, christmas.png
- focus.png, relax.png, acoustic.png, classical.png, citypop.png, fusion-traditional.png, party.png

### 아이콘 파일 (client/public/icons/)
28개 아이콘 파일 (각 256x256 PNG, 동일한 이름)

## 4단계: 설정 파일

### package.json
주요 의존성:
- React 19
- tRPC 11
- Drizzle ORM
- Tailwind CSS 4
- Radix UI
- AWS SDK S3

### 스크립트
```json
{
  "dev": "NODE_ENV=development tsx watch server/_core/index.ts",
  "build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "db:push": "drizzle-kit generate && drizzle-kit migrate"
}
```

## 5단계: 데이터베이스 복원

1. `pnpm db:push` 실행
2. 카테고리 28개 INSERT
3. 음악 트랙 126개 INSERT
4. 게시판 데이터 INSERT

## 6단계: 확인

1. `pnpm dev` 실행
2. 메인 페이지에서 카테고리 28개 확인
3. 각 카테고리 클릭하여 음악 재생 확인
4. 관리자 페이지에서 500MB 업로드 제한 확인

---

**중요 설정:**
- 음악 업로드 제한: **500MB**
- Express body-parser: **500mb**
- 카테고리 이미지: 256x256 PNG
- 아이콘: 256x256 PNG

이 모든 것을 자동으로 복원해줘!
