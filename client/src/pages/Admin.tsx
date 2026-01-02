import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, FolderOpen, ArrowLeft, Users, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import TracksManager from "@/components/admin/TracksManager";
import CategoriesManager from "@/components/admin/CategoriesManager";
import { UsersManager } from "@/components/admin/UsersManager";
import { StatsDashboard } from "@/components/admin/StatsDashboard";

export default function Admin() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
          <p className="text-muted-foreground mb-6">
            관리자 페이지에 접근하려면 로그인해주세요
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>로그인</a>
          </Button>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">접근 권한 없음</h2>
          <p className="text-muted-foreground mb-6">
            관리자 권한이 필요합니다
          </p>
          <Button asChild>
            <Link href="/">홈으로 이동</Link>
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
                <h1 className="text-2xl font-bold text-foreground">관리자 대시보드</h1>
                <p className="text-xs text-muted-foreground">음악 및 카테고리 관리</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {user.name || user.email}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8">
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              통계
            </TabsTrigger>
            <TabsTrigger value="tracks" className="gap-2">
              <Music className="w-4 h-4" />
              음악 관리
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              카테고리 관리
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              회원 관리
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <StatsDashboard />
          </TabsContent>

          <TabsContent value="tracks">
            <TracksManager />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesManager />
          </TabsContent>

          <TabsContent value="users">
            <UsersManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
