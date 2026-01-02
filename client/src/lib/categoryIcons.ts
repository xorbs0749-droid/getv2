/**
 * Category icon mapping
 * Maps category names/slugs to their corresponding icon image paths
 */

export const CATEGORY_ICONS: Record<string, string> = {
  // 장르 (special)
  "퓨전전통음악": "/icons/fusion-traditional.png",
  "fusion-traditional": "/icons/fusion-traditional.png",
  "시티팝": "/icons/citypop.png",
  "citypop": "/icons/citypop.png",
  "클래식": "/icons/classical.png",
  "classical": "/icons/classical.png",
  "어쿠스틱": "/icons/acoustic.png",
  "acoustic": "/icons/acoustic.png",

  // 장소 (place)
  "카페": "/icons/cafe.png",
  "cafe": "/icons/cafe.png",
  "라운지": "/icons/lounge.png",
  "lounge": "/icons/lounge.png",
  "식당": "/icons/restaurant.png",
  "restaurant": "/icons/restaurant.png",
  "스터디카페": "/icons/study-cafe.png",
  "study-cafe": "/icons/study-cafe.png",
  "사무실": "/icons/office.png",
  "office": "/icons/office.png",
  "파티": "/icons/party.png",
  "party": "/icons/party.png",
  "편집샵": "/icons/select-shop.png",
  "select-shop": "/icons/select-shop.png",
  "PUB": "/icons/pub.png",
  "pub": "/icons/pub.png",
  "로비": "/icons/lobby.png",
  "lobby": "/icons/lobby.png",

  // 상황 (situation)
  "아침": "/icons/morning.png",
  "morning": "/icons/morning.png",
  "점심": "/icons/lunch.png",
  "lunch": "/icons/lunch.png",
  "저녁": "/icons/evening.png",
  "evening": "/icons/evening.png",
  "집중": "/icons/focus.png",
  "focus": "/icons/focus.png",
  "휴식": "/icons/relax.png",
  "relax": "/icons/relax.png",
  "운동": "/icons/exercise.png",
  "exercise": "/icons/exercise.png",
  "크리스마스": "/icons/christmas.png",
  "christmas": "/icons/christmas.png",
  "벚꽃시즌": "/icons/cherry-blossom.png",
  "cherry-blossom": "/icons/cherry-blossom.png",
  "여름 바캉스": "/icons/summer-vacation.png",
  "summer-vacation": "/icons/summer-vacation.png",
  "가을 낙엽": "/icons/autumn-leaves.png",
  "autumn-leaves": "/icons/autumn-leaves.png",
  "드라이빙": "/icons/driving.png",
  "driving": "/icons/driving.png",

  // 날씨 (weather)
  "맑음": "/icons/sunny.png",
  "sunny": "/icons/sunny.png",
  "흐림": "/icons/cloudy.png",
  "cloudy": "/icons/cloudy.png",
  "비": "/icons/rainy.png",
  "rainy": "/icons/rainy.png",
  "눈": "/icons/snowy.png",
  "snowy": "/icons/snowy.png",
};

/**
 * Get icon path for a category
 * @param categoryName - Category name or slug
 * @param categorySlug - Category slug (optional fallback)
 * @returns Icon path or null if not found
 */
export function getCategoryIcon(categoryName: string, categorySlug?: string): string | null {
  // Try exact match first
  if (CATEGORY_ICONS[categoryName]) return `${CATEGORY_ICONS[categoryName]}?v=20260101`;
  
  // Try slug
  if (categorySlug && CATEGORY_ICONS[categorySlug]) return `${CATEGORY_ICONS[categorySlug]}?v=20260101`;
  
  // Try lowercase
  const lowerName = categoryName.toLowerCase();
  if (CATEGORY_ICONS[lowerName]) return `${CATEGORY_ICONS[lowerName]}?v=20260101`;
  
  // Try removing spaces and lowercase
  const normalizedName = categoryName.replace(/\s+/g, '-').toLowerCase();
  if (CATEGORY_ICONS[normalizedName]) return `${CATEGORY_ICONS[normalizedName]}?v=20260101`;
  
  // Try uppercase (for PUB, etc.)
  const upperName = categoryName.toUpperCase();
  if (CATEGORY_ICONS[upperName]) return `${CATEGORY_ICONS[upperName]}?v=20260101`;
  
  console.warn('No icon found for category:', categoryName, 'slug:', categorySlug);
  return null;
}
