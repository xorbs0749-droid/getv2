import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2, MessageCircle, Edit } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PostDetail() {
  const [, params] = useRoute("/community/post/:id");
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const postId = params?.id ? parseInt(params.id) : 0;

  const [commentContent, setCommentContent] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const utils = trpc.useUtils();
  const { data: post, isLoading: postLoading } = trpc.board.getById.useQuery({ id: postId });
  const { data: comments = [] } = trpc.comments.getByPostId.useQuery({ postId });

  const createCommentMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      toast.success("댓글이 작성되었습니다");
      setCommentContent("");
      utils.comments.getByPostId.invalidate({ postId });
    },
    onError: () => {
      toast.error("댓글 작성에 실패했습니다");
    },
  });

  const deletePostMutation = trpc.board.delete.useMutation({
    onSuccess: () => {
      toast.success("게시글이 삭제되었습니다");
      setLocation("/community");
    },
    onError: () => {
      toast.error("게시글 삭제에 실패했습니다");
    },
  });

  const handleCreateComment = async () => {
    if (!commentContent.trim()) {
      toast.error("댓글 내용을 입력해주세요");
      return;
    }
    await createCommentMutation.mutateAsync({
      postId,
      content: commentContent,
    });
  };

  const handleDeletePost = async () => {
    await deletePostMutation.mutateAsync({ id: postId });
  };

  if (authLoading || postLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">게시글을 찾을 수 없습니다</p>
          <Link href="/community">
            <Button>목록으로 돌아가기</Button>
          </Link>
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
              <Link href="/community">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">게시글 상세</h1>
              </div>
            </div>
            {user && (post.authorId === user.id || user.role === "admin") && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/community/post/${postId}/edit`)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  수정
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-4xl">
        {/* Post Content */}
        <Card className="p-6 mb-8">
          <div className="mb-4">
            {post.isPinned === 1 && (
              <span className="px-3 py-1 text-sm font-bold bg-red-500 text-white rounded mb-2 inline-block">
                공지
              </span>
            )}
            <h2 className="text-3xl font-bold text-foreground mb-2">{post.title}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                작성자: <span className={post.authorName === "spark" ? "text-orange-500 font-semibold" : ""}>
                  {post.authorName || "익명"}
                </span>
              </span>
              <span>작성일: {new Date(post.createdAt).toLocaleString()}</span>
              <span>조회수: {post.views}</span>
            </div>
          </div>
          <div className="border-t pt-6">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </div>
        </Card>

        {/* Comments Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-bold">댓글 {comments.length}개</h3>
          </div>

          {/* Comment Form */}
          {user ? (
            <Card className="p-4 mb-6">
              <Textarea
                placeholder="댓글을 입력해주세요"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={3}
                className="mb-3"
              />
              <div className="flex justify-end">
                <Button onClick={handleCreateComment} disabled={createCommentMutation.isPending}>
                  {createCommentMutation.isPending ? "작성 중..." : "댓글 작성"}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-4 mb-6 text-center">
              <p className="text-muted-foreground">댓글을 작성하려면 로그인해주세요</p>
            </Card>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment: any) => (
                <Card key={comment.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-medium text-sm ${comment.authorName === "spark" ? "text-orange-500 font-semibold" : ""}`}>
                          {comment.authorName || "익명"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">아직 댓글이 없습니다</p>
            </Card>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
