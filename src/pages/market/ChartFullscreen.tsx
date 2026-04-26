import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import {
  Granularity,
  SPACE_WARN_THRESHOLD,
} from "@/lib/marketMocks";
import { getForecastSeries } from "@/lib/predictionOutputs";
import { useProvince, type ProvinceCode } from "@/contexts/ProvinceContext";
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
    caption: "日前 vs 实时 vs 价差（日前电价 − 实时电价） + 出清电量",
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

const STORAGE_KEY = "market-board-interaction-state:v1";
const DEFAULT_ZOOM_WINDOW = { start: 0, end: 100 };
const getCurrentBusinessDate = () => {
  const date = new Date();
  const day = date.getDay();
  if (day === 0) date.setDate(date.getDate() - 2);
  if (day === 6) date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const chartKeyMap: Record<string, "price" | "load" | "renewable" | "space"> = {
  "price-spread": "price",
  "load-forecast": "load",
  "renewable-output": "renewable",
  "bidding-space": "space",
};

export default function ChartFullscreen() {
  const { chartId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { province, setProvince } = useProvince();
  const saved = useMemo(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
  }, []);
  const businessDate = useMemo(() => getCurrentBusinessDate(), []);
  const [granularity, setGranularity] = useState<Granularity>(
    (searchParams.get("g") as Granularity) ?? saved?.granularity ?? "hour"
  );
  const [startDate, setStartDate] = useState(saved?.startDate ?? businessDate);
  const [endDate, setEndDate] = useState(saved?.endDate ?? businessDate);
  const [zoomWindow, setZoomWindow] = useState<{ start: number; end: number }>(saved?.zoomWindow ?? DEFAULT_ZOOM_WINDOW);

  const meta = CHART_META[chartId];
  const forecastKind = chartKeyMap[chartId];
  const series = useMemo(() => forecastKind ? getForecastSeries(forecastKind, startDate, endDate, granularity) : [], [forecastKind, startDate, endDate, granularity]);
  const chartData = useMemo(() => {
    if (chartId === "price-spread") {
      return series.map((p) => ({ ...p, dayAhead: p.predicted, realtime: p.actual, spread: p.deviation, cleared: Math.max(400, Math.round(p.predicted * 2.2)) }));
    }
    if (chartId === "bidding-space") return series.map((p) => ({ ...p, warning: p.predicted < SPACE_WARN_THRESHOLD }));
    return series;
  }, [chartId, series]);
  const zoomData = useMemo(() => {
    const start = Math.floor((zoomWindow.start / 100) * chartData.length);
    const end = Math.max(start + 1, Math.ceil((zoomWindow.end / 100) * chartData.length));
    return chartData.slice(start, end);
  }, [chartData, zoomWindow]);
  const xKey = granularity === "day" ? "dayLabel" as const : "label" as const;
  const xInterval = granularity === "15min" ? 15 : granularity === "hour" ? 5 : 0;
  const periodLabel = (p: any) => p.date ? `${p.date} · 时段 ${p.periodRange}` : "";

  useEffect(() => {
    if (saved?.province) setProvince(saved.province as ProvinceCode);
  }, [saved?.province, setProvince]);

  useEffect(() => {
    if (typeof window === "undefined" || !chartId) return;
    const current = saved ?? {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...current,
      province,
      startDate,
      endDate,
      granularity,
      zoomWindow,
      activeChart: chartId,
      lastExpandedChart: chartId,
      chartCfgs: {
        ...(current.chartCfgs ?? {}),
        [chartKeyMap[chartId] ?? chartId]: {
          ...(current.chartCfgs?.[chartKeyMap[chartId] ?? chartId] ?? {}),
          granularity,
          zoomWindow,
        },
      },
    }));
  }, [province, startDate, endDate, granularity, zoomWindow, chartId, saved]);

  const applyZoomDrivenGranularity = (next: { start: number; end: number }) => {
    const width = next.end - next.start;
    setGranularity(width <= 35 ? "15min" : width <= 70 ? "hour" : "day");
  };

  const handleZoomWheel = (deltaY: number) => {
    setZoomWindow((current) => {
      const width = current.end - current.start;
      const nextWidth = Math.max(8, Math.min(100, width + (deltaY > 0 ? 10 : -10)));
      const center = (current.start + current.end) / 2;
      const start = Math.max(0, Math.min(100 - nextWidth, center - nextWidth / 2));
      const next = { start: Math.round(start), end: Math.round(start + nextWidth) };
      applyZoomDrivenGranularity(next);
      return next;
    });
  };

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
      xKey,
      xInterval,
      periodLabel,
      height: 0,
    };
    const h = Math.max(400, typeof window !== "undefined" ? window.innerHeight - 240 : 600);
    switch (chartId) {
      case "price-spread":
        return <PriceSpreadChart {...common} data={zoomData} height={h} />;
      case "load-forecast":
        return <LoadForecastChart {...common} data={zoomData} height={h} />;
      case "renewable-output":
        return <RenewableChart {...common} data={zoomData} height={h} />;
      case "bidding-space":
        return <BiddingSpaceChart {...common} data={zoomData} threshold={SPACE_WARN_THRESHOLD} height={h} />;
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
