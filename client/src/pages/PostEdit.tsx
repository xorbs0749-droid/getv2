import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function PostEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const postId = parseInt(id!);

  const { data: post, isLoading } = trpc.board.getById.useQuery({ id: postId });
  const updateMutation = trpc.board.update.useMutation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
    }
  }, [post]);

  // 권한 체크: 작성자 본인 또는 관리자만 수정 가능
  const canEdit = user && post && (post.authorId === user.id || user.role === "admin");

  if (authLoading || isLoading) {
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
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">로그인이 필요합니다</p>
          <Button onClick={() => setLocation("/")}>홈으로 돌아가기</Button>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">게시글을 찾을 수 없습니다</p>
          <Button onClick={() => setLocation("/community")}>목록으로 돌아가기</Button>
        </Card>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">수정 권한이 없습니다</p>
          <Button onClick={() => setLocation(`/community/post/${postId}`)}>게시글로 돌아가기</Button>
        </Card>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 모두 입력해주세요");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: postId,
        title: title.trim(),
        content: content.trim(),
      });
      toast.success("게시글이 수정되었습니다");
      setLocation(`/community/post/${postId}`);
    } catch (error: any) {
      toast.error(error.message || "게시글 수정에 실패했습니다");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/community/post/${postId}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">게시글 수정</h1>
              <p className="text-xs text-muted-foreground">게시글 내용을 수정합니다</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-4xl">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                maxLength={200}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">내용</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={15}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setLocation(`/community/post/${postId}`)}
              >
                취소
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "수정 중..." : "수정 완료"}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
