import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, MessageCircle, Edit, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface BoardCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const BOARD_CATEGORIES: BoardCategory[] = [
  { id: "general", name: "일반", description: "일반적인 이야기", icon: "💬" },
  { id: "tips", name: "팁 & 노하우", description: "BGM 활용 팁 공유", icon: "💡" },
  { id: "requests", name: "음악 요청", description: "원하는 음악 요청하기", icon: "🎵" },
  { id: "feedback", name: "피드백", description: "서비스 개선 의견", icon: "⭐" },
];

export default function Community() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const utils = trpc.useUtils();
  const { data: posts = [] } = trpc.board.getAll.useQuery();
  const createPostMutation = trpc.board.create.useMutation({
    onSuccess: () => {
      toast.success("게시글이 작성되었습니다");
      setTitle("");
      setContent("");
      setIsPinned(false);
      setShowCreateForm(false);
      utils.board.getAll.invalidate();
    },
    onError: () => {
      toast.error("게시글 작성에 실패했습니다");
    },
  });

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }
    await createPostMutation.mutateAsync({
      title,
      content,
      category: selectedCategory,
      isPinned: isPinned ? 1 : 0,
    });
  };

  const filteredPosts = posts.filter((p: any) => p.category === selectedCategory);

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
                <h1 className="text-2xl font-bold text-foreground">커뮤니티</h1>
                <p className="text-xs text-muted-foreground">사용자들과 소통하는 공간</p>
              </div>
            </div>
            {user && (
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                새 글 작성
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Create Post Form */}
        {showCreateForm && user ? (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">새 게시글 작성</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">카테고리</label>
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="grid w-full grid-cols-4">
                    {BOARD_CATEGORIES.map((cat) => (
                      <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                        <span>{cat.icon}</span>
                        <span className="hidden sm:inline">{cat.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">제목</label>
                <Input
                  placeholder="제목을 입력해주세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">내용</label>
                <Textarea
                  placeholder="내용을 입력해주세요"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />
              </div>
              {user?.role === "admin" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="isPinned" className="text-sm font-medium cursor-pointer">
                    공지사항으로 고정
                  </label>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePost}
                  disabled={createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? "작성 중..." : "작성"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  취소
                </Button>
              </div>
            </div>
          </Card>
        ) : !user ? (
          <Card className="p-8 text-center mb-8">
            <p className="text-muted-foreground mb-4">게시글을 작성하려면 로그인해주세요</p>
            <Button asChild>
              <a href={getLoginUrl()}>Google 로그인</a>
            </Button>
          </Card>
        ) : null}

        {/* Board Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
            {BOARD_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                <span>{cat.icon}</span>
                <span className="hidden sm:inline">{cat.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {BOARD_CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="space-y-4">
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-1">{cat.name}</h2>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </div>

              {filteredPosts.length > 0 ? (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-sm text-muted-foreground">
                          <th className="px-4 py-3 text-center w-20">번호</th>
                          <th className="px-4 py-3 text-left flex-1">제목</th>
                          <th className="px-4 py-3 text-center w-24">작성자</th>
                          <th className="px-4 py-3 text-center w-24">작성일</th>
                          <th className="px-4 py-3 text-center w-16">조회</th>
                          <th className="px-4 py-3 text-center w-20">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPosts.map((post: any, index: number) => (
                          <tr 
                            key={post.id}
                            className="border-b hover:bg-muted/50 transition cursor-pointer"
                            onClick={() => setLocation(`/community/post/${post.id}`)}
                          >
                            <td className="px-4 py-3 text-center text-sm">
                              {post.isPinned ? (
                                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded">
                                  공지
                                </span>
                              ) : (
                                filteredPosts.length - index
                              )}
                            </td>
                            <td className="px-4 py-3 text-left">
                              <span className="font-medium hover:text-primary">
                                {post.title}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              <span className={post.authorName === "spark" ? "text-orange-500 font-semibold" : "text-muted-foreground"}>
                                {post.authorName || "익명"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                              {post.views || 0}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {user && (user.id === post.userId || user.role === "admin") && (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLocation(`/community/post/${post.id}/edit`);
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-500 hover:text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm("정말 삭제하시겠습니까?")) {
                                        // TODO: 삭제 API 호출
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">아직 게시글이 없습니다</p>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
