import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Music, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: overallStats, isLoading } = trpc.stats.getOverallStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });
  const { data: categories } = trpc.categories.getAll.useQuery();
  
  const stats = overallStats ? {
    categoryCount: overallStats.totalCategories,
    trackCount: overallStats.totalTracks,
    categories: categories || [],
  } : null;

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    type: 'place' as 'special' | 'place' | 'situation' | 'weather',
    description: '',
    gradientFrom: '#3b82f6',
    gradientTo: '#8b5cf6',
  });

  // Track upload state
  const [trackForm, setTrackForm] = useState({
    title: '',
    artist: '',
    categoryId: '',
    file: null as File | null,
  });

  const utils = trpc.useUtils();

  const createCategoryMutation = trpc.admin.createCategory.useMutation({
    onSuccess: () => {
      toast.success('카테고리가 생성되었습니다');
      setCategoryForm({
        name: '',
        slug: '',
        type: 'place',
        description: '',
        gradientFrom: '#3b82f6',
        gradientTo: '#8b5cf6',
      });
      utils.stats.getOverallStats.invalidate();
      utils.categories.getAll.invalidate();
    },
    onError: () => {
      toast.error('카테고리 생성에 실패했습니다');
    },
  });

  const uploadTrackMutation = trpc.admin.uploadTrack.useMutation({
    onSuccess: () => {
      toast.success('트랙이 업로드되었습니다');
      setTrackForm({
        title: '',
        artist: '',
        categoryId: '',
        file: null,
      });
      utils.stats.getOverallStats.invalidate();
      utils.tracks.getAll.invalidate();
    },
    onError: () => {
      toast.error('트랙 업로드에 실패했습니다');
    },
  });

  const handleCreateCategory = () => {
    if (!categoryForm.name || !categoryForm.slug) {
      toast.error('카테고리 이름과 슬러그를 입력해주세요');
      return;
    }
    createCategoryMutation.mutate(categoryForm);
  };

  const handleUploadTrack = async () => {
    if (!trackForm.title || !trackForm.categoryId || !trackForm.file) {
      toast.error('모든 필드를 입력해주세요');
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1]!;
      
      uploadTrackMutation.mutate({
        title: trackForm.title,
        artist: trackForm.artist,
        categoryId: Number(trackForm.categoryId),
        audioFile: {
          data: base64Data,
          mimeType: trackForm.file!.type,
          size: trackForm.file!.size,
        },
      });
    };
    reader.readAsDataURL(trackForm.file);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
          <Button asChild>
            <a href={getLoginUrl()}>로그인</a>
          </Button>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">관리자 권한이 필요합니다</h2>
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
            <Link href="/saved">
              <Button variant="ghost">즐겨찾기</Button>
            </Link>
            <Link href="/board">
              <Button variant="ghost">게시판</Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost">관리자</Button>
            </Link>
            <Button variant="outline" onClick={logout}>
              로그아웃
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 px-4">
        <h2 className="text-3xl font-bold mb-6">관리자 대시보드</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>카테고리 수</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.categoryCount || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>트랙 수</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.trackCount || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Create Category */}
            <Card>
              <CardHeader>
                <CardTitle>카테고리 생성</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category-name">카테고리 이름</Label>
                  <Input
                    id="category-name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="예: 카페"
                  />
                </div>
                <div>
                  <Label htmlFor="category-slug">슬러그 (URL)</Label>
                  <Input
                    id="category-slug"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    placeholder="예: cafe"
                  />
                </div>
                <div>
                  <Label htmlFor="category-type">타입</Label>
                  <Select
                    value={categoryForm.type}
                    onValueChange={(value) => setCategoryForm({ ...categoryForm, type: value as any })}
                  >
                    <SelectTrigger id="category-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="place">장소</SelectItem>
                      <SelectItem value="situation">상황</SelectItem>
                      <SelectItem value="weather">날씨</SelectItem>
                      <SelectItem value="special">특별</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category-description">설명</Label>
                  <Textarea
                    id="category-description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="카테고리 설명"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gradient-from">그라데이션 시작 색상</Label>
                    <Input
                      id="gradient-from"
                      type="color"
                      value={categoryForm.gradientFrom}
                      onChange={(e) => setCategoryForm({ ...categoryForm, gradientFrom: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gradient-to">그라데이션 끝 색상</Label>
                    <Input
                      id="gradient-to"
                      type="color"
                      value={categoryForm.gradientTo}
                      onChange={(e) => setCategoryForm({ ...categoryForm, gradientTo: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateCategory}
                  disabled={createCategoryMutation.isPending}
                >
                  카테고리 생성
                </Button>
              </CardContent>
            </Card>

            {/* Upload Track */}
            <Card>
              <CardHeader>
                <CardTitle>트랙 업로드</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="track-title">트랙 제목</Label>
                  <Input
                    id="track-title"
                    value={trackForm.title}
                    onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                    placeholder="트랙 제목"
                  />
                </div>
                <div>
                  <Label htmlFor="track-artist">아티스트</Label>
                  <Input
                    id="track-artist"
                    value={trackForm.artist}
                    onChange={(e) => setTrackForm({ ...trackForm, artist: e.target.value })}
                    placeholder="아티스트 이름 (선택사항)"
                  />
                </div>
                <div>
                  <Label htmlFor="track-category">카테고리</Label>
                  <Select
                    value={trackForm.categoryId}
                    onValueChange={(value) => setTrackForm({ ...trackForm, categoryId: value })}
                  >
                    <SelectTrigger id="track-category">
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {stats?.categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="track-file">오디오 파일</Label>
                  <Input
                    id="track-file"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setTrackForm({ ...trackForm, file: e.target.files?.[0] || null })}
                  />
                </div>
                <Button
                  onClick={handleUploadTrack}
                  disabled={uploadTrackMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  트랙 업로드
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
