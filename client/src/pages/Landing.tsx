import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Music, Sparkles, Users, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/home");
    }
  }, [user, loading, setLocation]);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <div className="container py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold text-foreground">GetSpark</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            모두를 위한 스마트 배경음악
          </p>
          <Button size="lg" onClick={handleLogin} className="gap-2 text-lg px-8 py-6">
            <Zap className="w-5 h-5" />
            Google 계정으로 시작하기
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 text-center hover:shadow-lg transition">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI 추천</h3>
            <p className="text-muted-foreground">
              30개 이상의 카테고리에서 상황에 맞는 음악을 자동으로 추천합니다
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">다양한 장르</h3>
            <p className="text-muted-foreground">
              클래식, 재즈, EDM, 시티팝 등 다양한 장르의 음악을 제공합니다
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">커뮤니티</h3>
            <p className="text-muted-foreground">
              다른 사용자들과 음악을 공유하고 소통할 수 있습니다
            </p>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            지금 바로 무료로 시작하세요
          </p>
          <Button variant="outline" size="lg" onClick={handleLogin} className="gap-2">
            로그인하기
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 GetSpark. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
