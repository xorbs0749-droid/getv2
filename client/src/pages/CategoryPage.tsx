import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { Music, Loader2, Play, Heart } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { toast } from "sonner";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated, logout } = useAuth();
  // Get all categories and find by slug
  const { data: categories } = trpc.categories.getAll.useQuery();
  const category = categories?.find((c: any) => c.slug === slug);
  const categoryLoading = !categories;
  
  const { data: tracks, isLoading: tracksLoading } = trpc.tracks.getByCategory.useQuery(
    { categoryId: category?.id! },
    { enabled: !!category }
  );
  const { playTrack } = useMusicPlayer();
  const utils = trpc.useUtils();

  const saveMutation = trpc.saved.save.useMutation({
    onSuccess: () => {
      toast.success('트랙이 즐겨찾기에 추가되었습니다');
      utils.saved.getMySaved.invalidate();
    },
    onError: () => {
      toast.error('즐겨찾기 추가에 실패했습니다');
    },
  });

  const recordPlayMutation = trpc.stats.recordPlay.useMutation();

  const handlePlay = (trackId: number) => {
    const track = tracks?.find((t: any) => t.id === trackId);
    if (track && tracks) {
      playTrack(track, tracks);
      // Increment play count
      recordPlayMutation.mutate({ trackId });
    }
  };

  const handleSave = (trackId: number) => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다');
      return;
    }
    saveMutation.mutate({ trackId });
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">카테고리를 찾을 수 없습니다</h2>
          <Link href="/">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6" />
            <h1 className="text-xl font-bold">GetSpark</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">홈</Button>
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/saved">
                  <Button variant="ghost">즐겨찾기</Button>
                </Link>
                <Link href="/board">
                  <Button variant="ghost">게시판</Button>
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="ghost">관리자</Button>
                  </Link>
                )}
              </>
            )}
            {isAuthenticated ? (
              <Button variant="outline" onClick={logout}>
                로그아웃
              </Button>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>로그인</a>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Category Header */}
      <div
        className="h-48 bg-gradient-to-br flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(to bottom right, ${category.gradientFrom || '#3b82f6'}, ${category.gradientTo || '#8b5cf6'})`,
        }}
      >
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-lg opacity-90">{category.description}</p>
          )}
        </div>
      </div>

      {/* Tracks List */}
      <main className="flex-1 container mx-auto py-8 px-4">
        {tracksLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : tracks && tracks.length > 0 ? (
          <div className="space-y-2">
            {tracks.map((track) => (
              <Card key={track.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePlay(track.id)}
                  >
                    <Play className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{track.title}</div>
                    {track.artist && (
                      <div className="text-sm text-muted-foreground truncate">
                        {track.artist}
                      </div>
                    )}
                  </div>
                  {isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSave(track.id)}
                      disabled={saveMutation.isPending}
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">이 카테고리에는 아직 트랙이 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
