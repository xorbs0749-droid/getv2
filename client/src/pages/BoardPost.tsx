import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useParams, useLocation } from "wouter";
import { Music, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

export default function BoardPost() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: postData, isLoading } = trpc.board.getById.useQuery({ id: Number(id) });
  const { data: comments, isLoading: commentsLoading } = trpc.comments.getByPostId.useQuery({ postId: Number(id) });
  const [commentContent, setCommentContent] = useState('');
  const utils = trpc.useUtils();

  const createCommentMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      toast.success('댓글이 작성되었습니다');
      setCommentContent('');
      utils.comments.getByPostId.invalidate({ postId: Number(id) });
    },
    onError: () => {
      toast.error('댓글 작성에 실패했습니다');
    },
  });

  const deletePostMutation = trpc.board.delete.useMutation({
    onSuccess: () => {
      toast.success('게시글이 삭제되었습니다');
      setLocation('/board');
    },
    onError: () => {
      toast.error('게시글 삭제에 실패했습니다');
    },
  });

  const deleteCommentMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      toast.success('댓글이 삭제되었습니다');
      utils.comments.getByPostId.invalidate({ postId: Number(id) });
    },
    onError: () => {
      toast.error('댓글 삭제에 실패했습니다');
    },
  });

  const handleSubmitComment = () => {
    if (!commentContent.trim()) {
      toast.error('댓글 내용을 입력해주세요');
      return;
    }
    createCommentMutation.mutate({
      postId: Number(id),
      content: commentContent,
    });
  };

  const handleDeletePost = () => {
    if (confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      deletePostMutation.mutate({ id: Number(id) });
    }
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      deleteCommentMutation.mutate({ id: commentId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">게시글을 찾을 수 없습니다</h2>
          <Link href="/board">
            <Button>게시판으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const post = postData;
  const authorName = postData.authorName || '익명';
  const canDelete = user?.id === post.authorId || user?.role === 'admin';

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

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 px-4 max-w-4xl">
        <Link href="/board">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
        </Link>

        {/* Post */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{authorName}</span>
                  <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}</span>
                  <span>조회 {post.views}</span>
                </div>
              </div>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeletePost}
                  disabled={deletePostMutation.isPending}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
            <div className="prose max-w-none whitespace-pre-wrap">
              {post.content}
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">댓글 {comments?.length || 0}개</h2>

          {/* Comment Form */}
          {isAuthenticated ? (
            <Card>
              <CardContent className="p-4">
                <Textarea
                  placeholder="댓글을 입력하세요..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="mb-2"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={createCommentMutation.isPending}
                >
                  댓글 작성
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground mb-2">댓글을 작성하려면 로그인이 필요합니다</p>
                <Button asChild>
                  <a href={getLoginUrl()}>로그인</a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-2">
              {comments.map((item: any) => {
                const comment = item.comment;
                const commentAuthor = item.author;
                const canDeleteComment = user?.id === comment.authorId || user?.role === 'admin';

                return (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{commentAuthor.name || '익명'}</span>
                          <span className="text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko })}
                          </span>
                        </div>
                        {canDeleteComment && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{comment.content}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">아직 댓글이 없습니다</p>
          )}
        </div>
      </main>
    </div>
  );
}
