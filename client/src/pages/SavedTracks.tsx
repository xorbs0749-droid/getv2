import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MusicPlayer } from "@/components/MusicPlayer";
import { trpc } from "@/lib/trpc";
import { Music, Heart, ArrowLeft, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import type { Track } from "../../../drizzle/schema";

export default function SavedTracks() {
  const { user } = useAuth();
  const [playerInitialIndex, setPlayerInitialIndex] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);

  const { data: savedTracksData = [] } = trpc.saved.getMySaved.useQuery(undefined, {
    enabled: !!user,
  });

  // Extract tracks from saved tracks data
  const savedTracks = savedTracksData.filter(st => st.track).map(st => st.track!);
  
  const { data: storageInfo } = trpc.saved.getMyLimit.useQuery(undefined, {
    enabled: !!user,
  });

  const handleTrackPlay = (trackId: number, index: number) => {
    setPlayerInitialIndex(index);
    setShowPlayer(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
          <p className="text-muted-foreground mb-6">
            저장한 음악을 보려면 로그인해주세요
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>로그인</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">저장 목록</h1>
                <p className="text-xs text-muted-foreground">내가 좋아하는 음악</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Storage Info */}
        {storageInfo && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">저장 공간</h3>
                <p className="text-2xl font-bold text-primary">
                  {storageInfo.limit === -1 ? "무제한" : `${storageInfo.count} / ${storageInfo.limit}`}
                </p>
              </div>
              {storageInfo.limit !== -1 && !storageInfo.canSaveMore && (
                <Link href="/storage-packs">
                  <Button className="gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    추가 구매
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}

        {/* Saved Tracks List */}
        {savedTracksData.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">저장된 음악이 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              마음에 드는 음악을 저장해보세요
            </p>
            <Link href="/">
              <Button>음악 둘러보기</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedTracks.map((track, index) => (
              <Card
                key={track.id}
                onClick={() => handleTrackPlay(track.id, index)}
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Music className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground mb-1 truncate">
                      {track.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2 truncate">
                      {track.artist || "Unknown Artist"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Music Player */}
      {showPlayer && savedTracks.length > 0 && (
        <MusicPlayer
          tracks={savedTracks}
          initialIndex={playerInitialIndex}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>
  );
}
