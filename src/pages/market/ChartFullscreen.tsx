import { useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import {
  Granularity,
  getDataset,
  SPACE_WARN_THRESHOLD,
} from "@/lib/marketMocks";
import { MarketCursorProvider } from "@/contexts/MarketCursorContext";
import {
  PriceSpreadChart,
  LoadForecastChart,
  RenewableChart,
  BiddingSpaceChart,
} from "@/components/market/charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CHART_META: Record<string, { title: string; caption: string }> = {
  "price-spread": {
    title: "电价与价差",
    caption: "日前 vs 实时 vs 价差 + 出清电量",
  },
  "load-forecast": {
    title: "负荷预测 vs 实际",
    caption: "预测负荷与实际负荷对比 + 偏差曲线",
  },
  "renewable-output": {
    title: "新能源出力",
    caption: "风电 + 光伏 + 新能源总出力",
  },
  "bidding-space": {
    title: "竞价空间",
    caption: "总负荷预测 − 新能源预测，含预警阈值",
  },
};

export default function ChartFullscreen() {
  const { chartId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [granularity, setGranularity] = useState<Granularity>(
    (searchParams.get("g") as Granularity) ?? "hour"
  );

  const meta = CHART_META[chartId];
  const ds = useMemo(() => getDataset(granularity), [granularity]);

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        未知图表 ID：{chartId}
        <Link to="/tools/market" className="ml-2 text-primary hover:underline">返回看板</Link>
      </div>
    );
  }

  const renderChart = () => {
    const common = {
      data: [] as any[],
      xKey: ds.xKey,
      xInterval: ds.xInterval,
      periodLabel: ds.periodLabel,
      height: 0,
    };
    const h = Math.max(400, typeof window !== "undefined" ? window.innerHeight - 240 : 600);
    switch (chartId) {
      case "price-spread":
        return <PriceSpreadChart {...common} data={ds.price} height={h} />;
      case "load-forecast":
        return <LoadForecastChart {...common} data={ds.load} height={h} />;
      case "renewable-output":
        return <RenewableChart {...common} data={ds.renewable} height={h} />;
      case "bidding-space":
        return <BiddingSpaceChart {...common} data={ds.space} threshold={SPACE_WARN_THRESHOLD} height={h} />;
    }
  };

  return (
    <MarketCursorProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* 顶部 */}
        <header className="border-b bg-card px-5 py-3 flex items-center justify-between flex-wrap gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/tools/market"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              返回市场看板
            </Link>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-base font-semibold truncate">{meta.title}</h1>
            <span className="text-xs text-muted-foreground hidden md:inline truncate">
              · {meta.caption}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select defaultValue="anhui">
              <SelectTrigger className="h-7 w-20 text-xs"><MapPin className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="anhui">安徽</SelectItem>
                <SelectItem value="shandong">山东</SelectItem>
                <SelectItem value="guangdong">广东</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="2025-07-15">
              <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-07-15">2025-07-15</SelectItem>
                <SelectItem value="2025-07-14">2025-07-14</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded border overflow-hidden text-xs">
              <button
                onClick={() => setGranularity("15min")}
                className={`px-2 py-1 ${granularity === "15min" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              >15分 · 96点</button>
              <button
                onClick={() => setGranularity("hour")}
                className={`px-2 py-1 ${granularity === "hour" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              >1小时 · 24点</button>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> 更新 10:32
            </span>
          </div>
        </header>

        {/* 主图 */}
        <main className="flex-1 p-6">
          <div className="h-full rounded-lg shadow-notion bg-card p-5">
            {renderChart()}
          </div>
        </main>
      </div>
    </MarketCursorProvider>
  );
}
