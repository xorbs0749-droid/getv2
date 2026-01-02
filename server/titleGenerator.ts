/**
 * 카테고리별 자동 제목 생성 유틸리티
 * 파일명(예: 1, 2, 3)을 기반으로 카테고리에 맞는 제목을 생성합니다.
 */

const categoryTitles: Record<string, string[]> = {
  // 장소 카테고리
  "카페": ["아침 카페", "따뜻한 카페", "조용한 카페", "분위기 있는 카페", "편안한 카페"],
  "라운지": ["라운지 분위기", "고급스러운 라운지", "편한 라운지", "감성 라운지", "세련된 라운지"],
  "식당": ["식사 시간", "분위기 있는 식당", "편안한 식당", "고급 식당", "따뜻한 식당"],
  "스터디카페": ["집중력 높이기", "공부 분위기", "조용한 공부", "집중 시간", "효율적인 공부"],
  "사무실": ["업무 분위기", "생산성 높이기", "집중 업무", "효율적인 업무", "전문적인 분위기"],
  "파티": ["파티 분위기", "신나는 파티", "즐거운 파티", "활기찬 분위기", "신나는 음악"],
  
  // 상황 카테고리
  "명상": ["명상 음악", "깊은 명상", "평온함", "마음의 안정", "영혼의 휴식"],
  "집중": ["집중력 강화", "깊은 집중", "몰입", "효율성 증대", "집중의 시간"],
  "휴식": ["휴식 시간", "편안한 휴식", "심신 안정", "재충전", "여유로운 시간"],
  "운동": ["운동 분위기", "에너지 부스트", "활기찬 운동", "힘내기", "운동 모티베이션"],
  "수면": ["숙면 음악", "깊은 수면", "편안한 밤", "수면 유도", "꿈의 세계"],
  
  // 날씨 카테고리
  "아침": ["상큼한 아침", "활기찬 아침", "새로운 시작", "아침의 햇살", "기분 좋은 아침"],
  "저녁": ["저녁 감성", "노을 감성", "여유로운 저녁", "저녁의 여유", "감성적인 저녁"],
  "밤": ["밤의 감성", "조용한 밤", "깊은 밤", "밤의 여행", "별빛 아래"],
  "비": ["빗소리", "빗날의 감성", "촉촉한 분위기", "빗소리 명상", "빗날의 위로"],
  "자연": ["자연의 소리", "숲의 향기", "자연 명상", "산림욕", "자연과의 만남"],
  "날씨": ["날씨 좋은 날", "쾌청한 분위기", "맑은 날씨", "햇살 가득", "상큼한 날씨"],
  "포커스": ["포커스 음악", "집중 강화", "깊은 몰입", "효율성", "생산성"],
  "휴가": ["휴가 분위기", "여유로운 휴가", "휴식의 시간", "자유로운 기분", "여행의 기억"],
  "운전": ["운전 음악", "드라이브", "로드 트립", "운전 감성", "여행의 시작"],
};

/**
 * 카테고리와 파일 인덱스를 기반으로 자동 제목을 생성합니다.
 * @param categoryName 카테고리 이름
 * @param fileIndex 파일 인덱스 (0부터 시작)
 * @returns 생성된 제목
 */
export function generateTitle(categoryName: string, fileIndex: number): string {
  const titles = categoryTitles[categoryName];
  
  if (!titles) {
    // 카테고리가 없으면 기본 제목 생성
    return `${categoryName} 음악 ${fileIndex + 1}`;
  }
  
  // 인덱스에 맞는 제목 선택 (순환)
  const titleIndex = fileIndex % titles.length;
  return titles[titleIndex];
}

/**
 * 파일명을 기반으로 아티스트명을 생성합니다.
 * @param fileName 파일명 (예: "1.mp3", "2.mp3")
 * @returns 생성된 아티스트명
 */
export function generateArtist(fileName: string): string {
  // 파일 확장자 제거
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  
  // 숫자만 있으면 "GetSpark Original"으로 설정
  if (/^\d+$/.test(nameWithoutExt)) {
    return "GetSpark Original";
  }
  
  // 그 외의 경우 파일명을 아티스트명으로 사용
  return nameWithoutExt;
}

/**
 * 여러 파일에 대해 자동 제목을 생성합니다.
 * @param categoryName 카테고리 이름
 * @param fileNames 파일명 배열
 * @returns 제목 배열
 */
export function generateTitles(categoryName: string, fileNames: string[]): string[] {
  return fileNames.map((fileName, index) => generateTitle(categoryName, index));
}
