import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-12 text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">결제 완료!</h1>
        <p className="text-muted-foreground mb-8">
          저장 공간이 성공적으로 추가되었습니다.
          <br />
          이제 더 많은 음악을 저장할 수 있습니다.
        </p>
        
        <div className="flex flex-col gap-3">
          <Link href="/saved">
            <Button className="w-full">저장 목록으로 이동</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">홈으로 이동</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
