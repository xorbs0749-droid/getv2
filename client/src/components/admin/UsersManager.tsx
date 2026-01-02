import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, Mail, Calendar, UserCheck, Shield, Trash2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
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

export function UsersManager() {
  const { data: users = [], isLoading, refetch } = trpc.users.getAll.useQuery();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: (data) => {
      toast.success(`${selectedUser?.name || "사용자"}의 권한이 ${selectedUser?.role === "admin" ? "일반 사용자" : "관리자"}로 변경되었습니다.`);
      setRoleDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "권한 변경에 실패했습니다.");
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success(`${selectedUser?.name || "사용자"}가 삭제되었습니다.`);
      setDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "사용자 삭제에 실패했습니다.");
    },
  });

  const handleRoleChange = (user: any) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleDelete = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmRoleChange = () => {
    if (!selectedUser) return;
    const newRole = selectedUser.role === "admin" ? "user" : "admin";
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole,
    });
  };

  const confirmDelete = () => {
    if (!selectedUser) return;
    deleteMutation.mutate({
      userId: selectedUser.id,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">회원 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">회원 관리</h2>
          <p className="text-muted-foreground mt-1">
            전체 {users.length}명의 회원
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((user: any) => (
          <Card key={user.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{user.name || "이름 없음"}</h3>
                    {user.role === "admin" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        <Shield className="w-3 h-3" />
                        관리자
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        가입일: {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      <span>
                        최근 로그인: {formatDistanceToNow(new Date(user.lastSignedIn), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRoleChange(user)}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {user.role === "admin" ? "일반 회원으로" : "관리자로"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(user)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 권한 변경 확인 다이얼로그 */}
      <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              권한 변경 확인
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedUser?.name || "이 사용자"}</strong>의 권한을{" "}
              <strong>{selectedUser?.role === "admin" ? "일반 사용자" : "관리자"}</strong>로
              변경하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleChange}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "변경 중..." : "변경"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              회원 삭제 확인
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedUser?.name || "이 사용자"}</strong>를 정말 삭제하시겠습니까?
              <br />
              <span className="text-destructive font-medium">
                이 작업은 되돌릴 수 없으며, 사용자의 모든 데이터가 삭제됩니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
