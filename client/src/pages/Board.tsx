import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Plus, Edit2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Board() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const { data: posts = [], refetch } = trpc.board.getAll.useQuery();
  const createMutation = trpc.board.create.useMutation();
  const updateMutation = trpc.board.update.useMutation();
  const deleteMutation = trpc.board.delete.useMutation();

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          title,
          content,
          isPinned: isPinned ? 1 : 0,
        });
        toast.success("게시글이 수정되었습니다");
      } else {
        await createMutation.mutateAsync({
          title,
          content,
          isPinned: isPinned ? 1 : 0,
        });
        toast.success("게시글이 작성되었습니다");
      }
      setTitle("");
      setContent("");
      setIsPinned(false);
      setEditingId(null);
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error("오류가 발생했습니다");
    }
  };

  const handleEdit = (post: any) => {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setIsPinned(post.isPinned ?? false);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("게시글이 삭제되었습니다");
      refetch();
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다");
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">공지사항</h1>
          </div>
          {user?.role === "admin" && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  새 글 작성
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "게시글 수정" : "새 게시글 작성"}
                  </DialogTitle>
                  <DialogDescription>
                    공지사항을 작성하세요
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="제목"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="내용"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPinned"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="isPinned" className="text-sm text-foreground">
                      공지사항으로 고정
                    </label>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="w-full"
                  >
                    {editingId ? "수정" : "작성"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">아직 공지사항이 없습니다</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {post.isPinned && (
                        <span className="px-2 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded">
                          공지
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-foreground">
                        {post.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 mb-3">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                      <span>조회 {post.views}</span>
                    </div>
                  </div>
                  {user?.role === "admin" && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
