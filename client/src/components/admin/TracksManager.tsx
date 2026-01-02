import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TracksManager() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: tracks, isLoading } = trpc.tracks.getAll.useQuery();
  const { data: categories } = trpc.categories.getAll.useQuery();
  const utils = trpc.useUtils();

  const uploadMutation = trpc.admin.uploadTrack.useMutation({
    onSuccess: () => {
      toast.success("음악이 업로드되었습니다!");
      setIsUploadOpen(false);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      utils.tracks.getAll.invalidate();
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error(error.message);
      setUploadProgress(0);
    },
  });

  const uploadMultipleMutation = trpc.admin.uploadMultipleTracks.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.uploadedCount}개 파일이 업로드되었습니다!`);
      setIsUploadOpen(false);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      utils.tracks.getAll.invalidate();
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error(error.message);
      setUploadProgress(0);
    },
  });

  const updateMutation = trpc.admin.updateTrack.useMutation({
    onSuccess: () => {
      toast.success("음악이 수정되었습니다!");
      setIsEditOpen(false);
      setEditingTrack(null);
      utils.tracks.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.admin.deleteTrack.useMutation({
    onSuccess: () => {
      toast.success("음악이 삭제되었습니다!");
      utils.tracks.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const files = selectedFiles.length > 0 ? selectedFiles : Array.from(fileInputRef.current?.files || []);

    if (files.length === 0) {
      toast.error("파일을 선택해주세요");
      return;
    }

    // Check file sizes (max 500MB each)
    const oversizedFiles = files.filter(f => f.size > 500 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`파일 크기는 500MB 이하여야 합니다: ${oversizedFiles.map(f => f.name).join(", ")}`);
      return;
    }

    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    const categoryId = parseInt(formData.get("categoryId") as string);

    // If multiple files, upload sequentially one by one
    if (files.length > 1) {
      toast.info(`${files.length}개 파일 순차 업로드 시작...`);
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = Math.round(((i + 1) / files.length) * 100);
        setUploadProgress(progress);

        try {
          // Convert file to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = (reader.result as string).split(",")[1];
              resolve(result || "");
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Generate title from filename (remove extension)
          const fileName = file.name.replace(/\.[^/.]+$/, "");

          // Upload single file
          await new Promise<void>((resolve, reject) => {
            uploadMutation.mutate(
              {
                title: fileName,
                artist: artist || "Unknown Artist",
                categoryId,
                audioFile: {
                  data: base64,
                  mimeType: file.type,
                  size: file.size,
                },
              },
              {
                onSuccess: () => resolve(),
                onError: (error) => reject(error),
              }
            );
          });

          successCount++;
          toast.success(`${i + 1}/${files.length}: ${fileName} 업로드 완료`);
        } catch (error) {
          failCount++;
          toast.error(`${file.name} 업로드 실패`);
        }
      }

      setUploadProgress(0);
      setIsUploadOpen(false);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      utils.tracks.getAll.invalidate();

      if (failCount === 0) {
        toast.success(`${successCount}개 파일 모두 업로드 완료!`);
      } else {
        toast.warning(`${successCount}개 성공, ${failCount}개 실패`);
      }
    } else {
      // Single file upload
      const file = files[0];
      setUploadProgress(10);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        setUploadProgress(50);

        uploadMutation.mutate({
          title,
          artist,
          categoryId,
          audioFile: {
            data: base64 || "",
            mimeType: file.type,
            size: file.size,
          },
        });
      };

      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (track: any) => {
    setEditingTrack(track);
    setIsEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    updateMutation.mutate({
      id: editingTrack.id,
      title: formData.get("title") as string,
      artist: formData.get("artist") as string,
      categoryId: parseInt(formData.get("categoryId") as string),
    });
  };

  const handleDelete = (id: number, title: string) => {
    if (confirm(`"${title}" 음악을 삭제하시겠습니까?`)) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  // Filter tracks by category type
  const filteredTracks = tracks?.filter((track) => {
    if (selectedCategoryType === "all") return true;
    const category = categories?.find((c) => c.id === track.categoryId);
    return category?.type === selectedCategoryType;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">음악 목록</h2>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              음악 업로드
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 음악 업로드</DialogTitle>
              <DialogDescription>
                음악 파일을 업로드하고 정보를 입력하세요 (최대 500MB)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <Label htmlFor="file">음악 파일 (MP3)</Label>
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mp3,audio/mpeg"
                  multiple
                  required
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSelectedFiles(files);
                  }}
                  className="mt-1"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {selectedFiles.length}개 파일 선택됨
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="title">제목</Label>
                <Input id="title" name="title" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="artist">아티스트</Label>
                <Input id="artist" name="artist" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="categoryId">카테고리</Label>
                <Select name="categoryId" required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    업로드 중... {uploadProgress}%
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={uploadMutation.isPending}
                >
                  취소
                </Button>
                <Button type="submit" disabled={uploadMutation.isPending} className="gap-2">
                  <Upload className="w-4 h-4" />
                  업로드
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedCategoryType} onValueChange={setSelectedCategoryType} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-5 mb-6">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="place">장소</TabsTrigger>
          <TabsTrigger value="situation">상황</TabsTrigger>
          <TabsTrigger value="special">장르</TabsTrigger>
          <TabsTrigger value="weather">날씨</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategoryType} className="mt-0">
          <Card>
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>아티스트</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>소스</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTracks?.map((track) => {
              const category = categories?.find((c) => c.id === track.categoryId);
              return (
                <TableRow key={track.id}>
                  <TableCell className="font-medium">{track.title}</TableCell>
                  <TableCell>{track.artist || "-"}</TableCell>
                  <TableCell>{category?.name || "-"}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                      {track.audioUrl ? "S3" : "Google Drive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(track)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(track.id, track.title)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!filteredTracks || filteredTracks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  등록된 음악이 없습니다
                </TableCell>
              </TableRow>
            ) : null}
            </TableBody>
          </Table>
        </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>음악 수정</DialogTitle>
            <DialogDescription>음악 정보를 수정하세요</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">제목</Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={editingTrack?.title}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-artist">아티스트</Label>
              <Input
                id="edit-artist"
                name="artist"
                defaultValue={editingTrack?.artist || ""}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-categoryId">카테고리</Label>
              <Select name="categoryId" defaultValue={editingTrack?.categoryId?.toString()}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-googleDriveUrl">Google Drive URL (선택)</Label>
              <Input
                id="edit-googleDriveUrl"
                name="googleDriveUrl"
                defaultValue={editingTrack?.googleDriveUrl || ""}
                placeholder="https://drive.google.com/file/d/..."
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
