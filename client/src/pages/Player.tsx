import { useEffect, useState } from "react";
import { MusicPlayer } from "@/components/MusicPlayer";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTimeBasedBackground } from "@/hooks/useTimeBasedBackground";

export default function Player() {
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState<string>("");
  const [categoryImage, setCategoryImage] = useState<string>("");
  const [categoryType, setCategoryType] = useState<"place" | "situation" | "weather">("place");
  const [autoPlayIndex, setAutoPlayIndex] = useState<number>(0);
  const timeBasedBackground = useTimeBasedBackground();

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const id = params.get("categoryId");
    const name = params.get("categoryName");
    const image = params.get("categoryImage");
    const type = (params.get("categoryType") as "place" | "situation" | "weather") || "place";
    
    if (id) {
      setCategoryId(parseInt(id));
      setCategoryName(name || "BGM");
      setCategoryImage(image || "");
      setCategoryType(type);
    }
  }, []);

  // Query tracks by category ID directly
  const { data: categoryTracks = [] } = trpc.tracks.getByCategory.useQuery(
    { categoryId: categoryId ?? 0 },
    { enabled: !!categoryId }
  );

  // Set random index for autoplay when tracks load
  useEffect(() => {
    if (categoryTracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * categoryTracks.length);
      setAutoPlayIndex(randomIndex);
    }
  }, [categoryTracks]);

  const handleClose = () => {
    window.close();
  };

  if (!categoryId) {
    return (
      <div className={`min-h-screen ${timeBasedBackground.gradientClass} flex items-center justify-center transition-all duration-1000`}>
        <Card className="p-4 text-center max-w-[180px]">
          <h2 className="text-sm font-bold mb-2">오류</h2>
          <p className="text-muted-foreground text-xs mb-3">
            카테고리 정보를 찾을 수 없습니다
          </p>
          <Button size="sm" onClick={handleClose}>닫기</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {categoryTracks.length > 0 ? (
        <MusicPlayer
          tracks={categoryTracks}
          initialIndex={autoPlayIndex}
          autoPlay={true}
          categoryImage={categoryImage}
          categoryName={categoryName}
          onClose={handleClose}
        />
      ) : (
        <div className={`min-h-screen ${timeBasedBackground.gradientClass} flex items-center justify-center transition-all duration-1000`}>
          <Card className="p-4 text-center max-w-[180px]">
            <p className="text-muted-foreground text-xs">
              이 카테고리의 음악을 찾을 수 없습니다
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
