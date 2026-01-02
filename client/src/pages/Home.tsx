import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryCard } from "@/components/CategoryCard";
import { MusicPlayer } from "@/components/MusicPlayer";
import { trpc } from "@/lib/trpc";
import { Zap, Heart, LogIn, LogOut, MessageSquare, BookOpen, Music } from "lucide-react";
import { useTimeBasedBackground } from "@/hooks/useTimeBasedBackground";
import { Link } from "wouter";
import type { Track } from "../../../drizzle/schema";

export default function Home() {
  const { user, logout } = useAuth();
  const { gradientClass, textColor } = useTimeBasedBackground();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [playerTracks, setPlayerTracks] = useState<Track[]>([]);
  const [playerInitialIndex, setPlayerInitialIndex] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);

  const { data: placeCategories = [] } = trpc.categories.getByType.useQuery({ type: "place" });
  const { data: situationCategories = [] } = trpc.categories.getByType.useQuery({ type: "situation" });
  const { data: weatherCategories = [] } = trpc.categories.getByType.useQuery({ type: "weather" });
  const { data: specialCategories = [] } = trpc.categories.getByType.useQuery({ type: "special" });
  const { data: counters = { totalUsers: 0, activeUsers24h: 0 } } = trpc.stats.getCounters.useQuery();

  const { data: tracks = [] } = trpc.tracks.getByCategory.useQuery(
    { categoryId: selectedCategory ?? 0 },
    { enabled: !!selectedCategory }
  );

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategory(categoryId);
  };

  const handleTrackPlay = (track: Track, allTracks: Track[]) => {
    const index = allTracks.findIndex((t) => t.id === track.id);
    setPlayerTracks(allTracks);
    setPlayerInitialIndex(index);
    setShowPlayer(true);
  };

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div className={`min-h-screen ${gradientClass} transition-colors duration-1000`}>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/home">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">GetSpark</h1>
                  <p className="text-xs text-muted-foreground">모두를 위한 스마트 배경음악</p>
                </div>
              </div>
            </Link>
            
            <div className="flex items-center gap-3">
              <Link href="/community">
                <Button variant="outline" size="sm" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  게시판
                </Button>
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    관리자
                  </Button>
                </Link>
              )}
              {user ? (
                <>
                  <Link href="/saved">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Heart className="w-4 h-4" />
                      저장 목록
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{user.name}</span>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </Button>
                  </div>
                </>
              ) : (
                <Button asChild size="sm" className="gap-2">
                  <a href={getLoginUrl()}>
                    <LogIn className="w-4 h-4" />
                    Google 로그인
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold mb-3 text-white drop-shadow-lg">
            상황에 맞는 완벽한 BGM
          </h2>
          <p className="text-lg text-white/90 drop-shadow-md">
            장소, 상황, 날씨에 따라 자동으로 추천되는 배경음악을 즐겨보세요
          </p>
          
          <div className="mt-6 flex justify-center gap-8 text-sm">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-primary">{counters.totalUsers.toLocaleString()}</span>
              <span className="text-white/80">누적 사용자</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-orange-500">{counters.activeUsers24h.toLocaleString()}</span>
              <span className="text-white/80">최근 24시간 활동</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="place" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="special" className="text-base font-bold">
              장르
            </TabsTrigger>
            <TabsTrigger value="place" className="text-base font-bold">
              장소
            </TabsTrigger>
            <TabsTrigger value="situation" className="text-base font-bold">
              상황
            </TabsTrigger>
            <TabsTrigger value="weather" className="text-base font-bold">
              날씨
            </TabsTrigger>
          </TabsList>

          <TabsContent value="special" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specialCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  categoryType="special"
                  onClick={() => handleCategoryClick(category.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="place" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {placeCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  categoryType="place"
                  onClick={() => handleCategoryClick(category.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="situation" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {situationCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  categoryType="situation"
                  onClick={() => handleCategoryClick(category.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="weather" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {weatherCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  categoryType="weather"
                  onClick={() => handleCategoryClick(category.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Track List Modal */}
        {selectedCategory && tracks.length > 0 && !showPlayer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-2xl font-bold text-foreground">재생 목록</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  닫기
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-3">
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => handleTrackPlay(track, tracks)}
                      className="p-4 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Music className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground truncate">{track.title}</h4>
                          {track.artist && (
                            <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                          )}
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Music Player */}
      {showPlayer && (
        <MusicPlayer
          tracks={playerTracks}
          initialIndex={playerInitialIndex}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>
  );
}
