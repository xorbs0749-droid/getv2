import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const PACKS = [
  {
    id: "extra_5" as const,
    name: "저장 공간 +5",
    description: "5개의 추가 저장 공간",
    price: "2,900원",
    features: ["5개 추가 저장", "영구 보관", "즉시 사용 가능"],
  },
  {
    id: "extra_10" as const,
    name: "저장 공간 +10",
    description: "10개의 추가 저장 공간",
    price: "4,900원",
    popular: true,
    features: ["10개 추가 저장", "영구 보관", "즉시 사용 가능", "15% 할인"],
  },
  {
    id: "unlimited" as const,
    name: "무제한 저장",
    description: "무제한 저장 공간 (평생)",
    price: "9,900원",
    features: ["무제한 저장", "영구 보관", "즉시 사용 가능", "최고의 가치"],
  },
];

export default function StoragePacks() {
  const { user } = useAuth();

  const { data: storageInfo } = trpc.saved.getMyLimit.useQuery(undefined, {
    enabled: !!user,
  });

  const createCheckoutMutation = trpc.storagePacks.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("결제 페이지로 이동합니다...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePurchase = (packId: "extra_5" | "extra_10" | "unlimited") => {
    if (!user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    createCheckoutMutation.mutate({ packType: packId });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
          <p className="text-muted-foreground mb-6">
            저장 팩을 구매하려면 로그인해주세요
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>로그인</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <Link href="/saved">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">저장 공간 구매</h1>
              <p className="text-xs text-muted-foreground">더 많은 음악을 저장하세요</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        {/* Current Storage Info */}
        {storageInfo && (
          <Card className="p-6 mb-12 bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-2">현재 저장 공간</h3>
              <p className="text-3xl font-bold text-primary">
                {storageInfo.limit === -1 ? "무제한" : `${storageInfo.count} / ${storageInfo.limit}`}
              </p>
            </div>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PACKS.map((pack) => (
            <Card
              key={pack.id}
              className={`p-8 relative ${
                pack.popular ? "border-primary border-2 shadow-xl" : ""
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold">
                  인기
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{pack.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{pack.description}</p>
                <div className="text-4xl font-bold text-primary">{pack.price}</div>
              </div>

              <ul className="space-y-3 mb-8">
                {pack.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePurchase(pack.id)}
                disabled={createCheckoutMutation.isPending}
                className="w-full gap-2"
                variant={pack.popular ? "default" : "outline"}
              >
                <ShoppingCart className="w-4 h-4" />
                구매하기
              </Button>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center text-muted-foreground text-sm max-w-2xl mx-auto">
          <p className="mb-2">
            ✓ 모든 결제는 Stripe를 통해 안전하게 처리됩니다
          </p>
          <p className="mb-2">
            ✓ 구매한 저장 공간은 영구적으로 사용 가능합니다
          </p>
          <p>
            ✓ 테스트 결제는 카드번호 4242 4242 4242 4242를 사용하세요
          </p>
        </div>
      </main>
    </div>
  );
}
