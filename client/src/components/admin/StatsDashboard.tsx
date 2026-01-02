import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Users, Music, FolderOpen, PlayCircle, TrendingUp, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function StatsDashboard() {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("daily");
  
  const { data: overallStats, isLoading: overallLoading } = trpc.stats.getOverallStats.useQuery();
  const { data: userGrowth, isLoading: growthLoading } = trpc.stats.getUserGrowth.useQuery();
  const { data: categoryStats, isLoading: categoryLoading } = trpc.stats.getCategoryStats.useQuery();

  if (overallLoading || growthLoading || categoryLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getGrowthData = () => {
    if (!userGrowth) return [];
    switch (timeRange) {
      case "daily":
        return userGrowth.daily.map((d) => ({ name: d.date.slice(5), value: d.count }));
      case "weekly":
        return userGrowth.weekly.map((d) => ({ name: d.week, value: d.count }));
      case "monthly":
        return userGrowth.monthly.map((d) => ({ name: d.month, value: d.count }));
    }
  };

  const categoryPlayData = categoryStats?.map((c) => ({
    name: c.categoryName,
    plays: c.totalPlays,
    tracks: c.trackCount,
  })) || [];

  const pieData = categoryStats?.filter((c) => c.totalPlays > 0).map((c) => ({
    name: c.categoryName,
    value: c.totalPlays,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Overall Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats?.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">총 사용자</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats?.activeUsers24h.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">24시간 활동</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats?.activeUsers7d.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">7일 활동</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Music className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats?.totalTracks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">총 트랙</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FolderOpen className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats?.totalCategories.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">카테고리</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <PlayCircle className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats?.totalPlays.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">총 재생</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>사용자 증가 추이</CardTitle>
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
              <TabsList>
                <TabsTrigger value="daily">일별</TabsTrigger>
                <TabsTrigger value="weekly">주별</TabsTrigger>
                <TabsTrigger value="monthly">월별</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getGrowthData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} name="신규 가입" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Play Count Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 재생 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPlayData.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="plays" fill="#3b82f6" radius={[0, 4, 4, 0]} name="재생 수" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리 재생 비율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  재생 데이터가 없습니다
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Table */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리별 상세 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">카테고리</th>
                  <th className="text-right py-3 px-4 font-medium">트랙 수</th>
                  <th className="text-right py-3 px-4 font-medium">총 재생</th>
                  <th className="text-right py-3 px-4 font-medium">평균 재생</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats?.map((cat, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{cat.categoryName}</td>
                    <td className="text-right py-3 px-4">{cat.trackCount}</td>
                    <td className="text-right py-3 px-4">{cat.totalPlays.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">
                      {cat.trackCount > 0 ? Math.round(cat.totalPlays / cat.trackCount).toLocaleString() : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
