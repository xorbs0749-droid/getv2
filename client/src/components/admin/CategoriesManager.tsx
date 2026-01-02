import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function CategoriesManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const { data: categories, isLoading } = trpc.categories.getAll.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.admin.createCategory.useMutation({
    onSuccess: () => {
      toast.success("카테고리가 생성되었습니다!");
      setIsCreateOpen(false);
      utils.categories.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.admin.updateCategory.useMutation({
    onSuccess: () => {
      toast.success("카테고리가 수정되었습니다!");
      setIsEditOpen(false);
      setEditingCategory(null);
      utils.categories.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.admin.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("카테고리가 삭제되었습니다!");
      utils.categories.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createMutation.mutate({
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      type: formData.get("type") as "place" | "situation" | "weather",
      description: formData.get("description") as string,
      icon: formData.get("icon") as string,
      gradientFrom: formData.get("gradientFrom") as string,
      gradientTo: formData.get("gradientTo") as string,
      order: parseInt(formData.get("order") as string) || 0,
    });
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    updateMutation.mutate({
      id: editingCategory.id,
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      type: formData.get("type") as "place" | "situation" | "weather",
      description: formData.get("description") as string,
      icon: formData.get("icon") as string,
      gradientFrom: formData.get("gradientFrom") as string,
      gradientTo: formData.get("gradientTo") as string,
      order: parseInt(formData.get("order") as string) || 0,
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`"${name}" 카테고리를 삭제하시겠습니까?\n연결된 음악이 있으면 삭제할 수 없습니다.`)) {
      deleteMutation.mutate({ id });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      place: "장소",
      situation: "상황",
      weather: "날씨",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">카테고리 목록</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              카테고리 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 카테고리 추가</DialogTitle>
              <DialogDescription>카테고리 정보를 입력하세요</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">이름</Label>
                  <Input id="name" name="name" required className="mt-1" placeholder="카페" />
                </div>
                <div>
                  <Label htmlFor="slug">슬러그</Label>
                  <Input id="slug" name="slug" required className="mt-1" placeholder="cafe" />
                </div>
              </div>
              <div>
                <Label htmlFor="type">타입</Label>
                <Select name="type" required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="place">장소</SelectItem>
                    <SelectItem value="situation">상황</SelectItem>
                    <SelectItem value="weather">날씨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  name="description"
                  className="mt-1"
                  placeholder="차분하고 편안한 카페 분위기"
                />
              </div>
              <div>
                <Label htmlFor="icon">아이콘 (Lucide 아이콘 이름)</Label>
                <Input id="icon" name="icon" className="mt-1" placeholder="Coffee" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gradientFrom">그라데이션 시작 색상</Label>
                  <Input
                    id="gradientFrom"
                    name="gradientFrom"
                    type="color"
                    required
                    className="mt-1 h-10"
                    defaultValue="#FFB84D"
                  />
                </div>
                <div>
                  <Label htmlFor="gradientTo">그라데이션 끝 색상</Label>
                  <Input
                    id="gradientTo"
                    name="gradientTo"
                    type="color"
                    required
                    className="mt-1 h-10"
                    defaultValue="#FF8C42"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="order">정렬 순서</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  defaultValue={0}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createMutation.isPending}
                >
                  취소
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  추가
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>슬러그</TableHead>
              <TableHead>타입</TableHead>
              <TableHead>색상</TableHead>
              <TableHead>순서</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>{getTypeLabel(category.type)}</TableCell>
                <TableCell>
                  <div
                    className="w-16 h-6 rounded"
                    style={{
                      background: `linear-gradient(135deg, ${category.gradientFrom} 0%, ${category.gradientTo} 100%)`,
                    }}
                  />
                </TableCell>
                <TableCell>{category.order}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id, category.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!categories || categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  등록된 카테고리가 없습니다
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>카테고리 수정</DialogTitle>
            <DialogDescription>카테고리 정보를 수정하세요</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">이름</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingCategory?.name}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-slug">슬러그</Label>
                <Input
                  id="edit-slug"
                  name="slug"
                  defaultValue={editingCategory?.slug}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-type">타입</Label>
              <Select name="type" defaultValue={editingCategory?.type}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="place">장소</SelectItem>
                  <SelectItem value="situation">상황</SelectItem>
                  <SelectItem value="weather">날씨</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">설명</Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={editingCategory?.description || ""}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-icon">아이콘 (Lucide 아이콘 이름)</Label>
              <Input
                id="edit-icon"
                name="icon"
                defaultValue={editingCategory?.icon || ""}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-gradientFrom">그라데이션 시작 색상</Label>
                <Input
                  id="edit-gradientFrom"
                  name="gradientFrom"
                  type="color"
                  defaultValue={editingCategory?.gradientFrom}
                  required
                  className="mt-1 h-10"
                />
              </div>
              <div>
                <Label htmlFor="edit-gradientTo">그라데이션 끝 색상</Label>
                <Input
                  id="edit-gradientTo"
                  name="gradientTo"
                  type="color"
                  defaultValue={editingCategory?.gradientTo}
                  required
                  className="mt-1 h-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-order">정렬 순서</Label>
              <Input
                id="edit-order"
                name="order"
                type="number"
                defaultValue={editingCategory?.order || 0}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={updateMutation.isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                저장
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
