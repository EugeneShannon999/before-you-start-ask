import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronDown,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getDataset,
  Granularity,
  boundaryRows,
  biddingSpaceByOffset,
  marketBoundaryCore,
  thermalUnits,
  thermalRealtimeSummary,
  getThermalMonthlyProfile,
  ruleAlertReports,
  powerForecastCards,
  SPACE_WARN_THRESHOLD,
  boundary96,
  load96,
  renewable96,
  priceForecastLink24,
  weather24,
  aggregateToHour,
  type BiddingDayOffset,
  type DataSourceTag,
} from "@/lib/marketMocks";
import { getForecastSeries, summarizeForecast } from "@/lib/predictionOutputs";
import { MarketCursorProvider } from "@/contexts/MarketCursorContext";
import { useProvince, type ProvinceCode } from "@/contexts/ProvinceContext";

import { ChartCard } from "@/components/market/ChartCard";
import {
  PriceSpreadChart,
  LoadForecastChart,
  RenewableChart,
  BiddingSpaceChart,
  BoundaryMiniChart,
  C_PRIMARY,
  C_SUCCESS,
  C_WARNING,
} from "@/components/market/charts";
import { SpreadFactorMatrix } from "@/components/market/SpreadFactorMatrix";
import type { RangeKey } from "@/components/market/ChartToolbar";

interface ChartCfg {
  granularity: Granularity;
  range: RangeKey;
  showLegend: boolean;
  zoomWindow: { start: number; end: number };
}

const getCurrentBusinessDate = () => {
  const date = new Date();
  const day = date.getDay();
  if (day === 0) date.setDate(date.getDate() - 2);
  if (day === 6) date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};
const rangeDays: Record<RangeKey, number> = { "1d": 1, "2d": 2, "4d": 4, "7d": 7 };
type MainChartId = "price-spread" | "load-forecast" | "renewable-output" | "bidding-space";
const STORAGE_KEY = "market-board-interaction-state:v1";

const DEFAULT_ZOOM_WINDOW = { start: 0, end: 100 };
const initialCfg = (g: Granularity): ChartCfg => ({ granularity: g, range: "1d", showLegend: true, zoomWindow: DEFAULT_ZOOM_WINDOW });
const restoreCfg = (cfg: ChartCfg | undefined, g: Granularity): ChartCfg => ({
  granularity: g,
  range: cfg?.range ?? "1d",
  showLegend: cfg?.showLegend ?? true,
  zoomWindow: cfg?.zoomWindow ?? DEFAULT_ZOOM_WINDOW,
});

export default function MarketInfo() {
  const { province, setProvince } = useProvince();
  const businessDate = useMemo(() => getCurrentBusinessDate(), []);
  const saved = useMemo(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
  }, []);
  const [globalGranularity, setGlobalGranularity] = useState<Granularity>(saved?.granularity ?? "hour");
  const [boundaryExpanded, setBoundaryExpanded] = useState(false);
  const [startDate, setStartDate] = useState(saved?.startDate ?? businessDate);
  const [endDate, setEndDate] = useState(saved?.endDate ?? businessDate);
  const [activeChart, setActiveChart] = useState<MainChartId | null>(saved?.activeChart ?? null);
  const [expandedChart, setExpandedChart] = useState<MainChartId | null>(null);
  const [zoomWindow, setZoomWindow] = useState<{ start: number; end: number }>(saved?.zoomWindow ?? { start: 0, end: 100 });
  const [biddingOffset, setBiddingOffset] = useState<BiddingDayOffset>(saved?.biddingOffset ?? "D-1");
  const [selectedUnitId, setSelectedUnitId] = useState(saved?.selectedUnitId ?? thermalUnits[0].id);
  const [alertStatus, setAlertStatus] = useState("全部");

  // 每图独立配置（粒度可被全局或单独控制）
  const [priceCfg, setPriceCfg] = useState<ChartCfg>(restoreCfg(saved?.chartCfgs?.price, globalGranularity));
  const [loadCfg, setLoadCfg] = useState<ChartCfg>(restoreCfg(saved?.chartCfgs?.load, globalGranularity));
  const [renCfg, setRenCfg] = useState<ChartCfg>(restoreCfg(saved?.chartCfgs?.renewable, globalGranularity));
  const [spaceCfg, setSpaceCfg] = useState<ChartCfg>(restoreCfg(saved?.chartCfgs?.space, globalGranularity));

  // 系列可见性
  const [priceSeries, setPriceSeries] = useState(saved?.priceSeries ?? { dayAhead: true, realtime: true, spread: true, cleared: true });
  const [loadSeries, setLoadSeries] = useState(saved?.loadSeries ?? { predicted: true, actual: true, deviation: true });
  const [renSeries, setRenSeries] = useState(saved?.renSeries ?? { predicted: true, actual: true, deviation: true });
  const [spaceSeries, setSpaceSeries] = useState(saved?.spaceSeries ?? { predicted: true, actual: true, deviation: true });

  const setGlobalAll = (g: Granularity) => {
    setGlobalGranularity(g);
    setPriceCfg((c) => ({ ...c, granularity: g }));
    setLoadCfg((c) => ({ ...c, granularity: g }));
    setRenCfg((c) => ({ ...c, granularity: g }));
    setSpaceCfg((c) => ({ ...c, granularity: g }));
  };

  const applyQuickRange = (days: number) => {
    const end = new Date(`${businessDate}T00:00:00`);
    const start = new Date(end);
    start.setDate(end.getDate() - days + 1);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  const applyChartRange = (range: RangeKey, setter: (fn: (c: ChartCfg) => ChartCfg) => void) => {
    setter((c) => ({ ...c, range }));
    applyQuickRange(rangeDays[range]);
  };

  const applyZoomDrivenGranularity = (next: { start: number; end: number }) => {
    const width = next.end - next.start;
    setGlobalAll(width <= 35 ? "15min" : width <= 70 ? "hour" : "day");
  };

  const syncActiveChartZoom = (next: { start: number; end: number }, chartId: MainChartId | null = activeChart) => {
    if (chartId === "price-spread") setPriceCfg((c) => ({ ...c, zoomWindow: next }));
    if (chartId === "load-forecast") setLoadCfg((c) => ({ ...c, zoomWindow: next }));
    if (chartId === "renewable-output") setRenCfg((c) => ({ ...c, zoomWindow: next }));
    if (chartId === "bidding-space") setSpaceCfg((c) => ({ ...c, zoomWindow: next }));
  };

  const handleZoomWheel = (deltaY: number, chartId?: MainChartId) => {
    if (chartId) setActiveChart(chartId);
    setZoomWindow((current) => {
      const width = current.end - current.start;
      const nextWidth = Math.max(8, Math.min(100, width + (deltaY > 0 ? 10 : -10)));
      const center = (current.start + current.end) / 2;
      const start = Math.max(0, Math.min(100 - nextWidth, center - nextWidth / 2));
      const next = { start: Math.round(start), end: Math.round(start + nextWidth) };
      applyZoomDrivenGranularity(next);
      syncActiveChartZoom(next, chartId ?? activeChart);
      return next;
    });
  };

  const resetZoom = (chartId?: MainChartId) => {
    setZoomWindow(DEFAULT_ZOOM_WINDOW);
    setGlobalAll("hour");
    syncActiveChartZoom(DEFAULT_ZOOM_WINDOW, chartId ?? activeChart);
  };

  const openChartPage = (chartId: MainChartId) => {
    setActiveChart(chartId);
    syncActiveChartZoom(zoomWindow, chartId);
    window.open(`/tools/market/chart/${chartId}`, "_blank", "noopener,noreferrer");
  };

  const zoomData = <T,>(items: T[]) => {
    const start = Math.floor((zoomWindow.start / 100) * items.length);
    const end = Math.max(start + 1, Math.ceil((zoomWindow.end / 100) * items.length));
    return items.slice(start, end);
  };

  useEffect(() => {
    if (saved?.province) setProvince(saved.province as ProvinceCode);
  }, [saved?.province, setProvince]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      province, startDate, endDate, granularity: globalGranularity,
      chartCfgs: { price: priceCfg, load: loadCfg, renewable: renCfg, space: spaceCfg },
      priceSeries, loadSeries, renSeries, spaceSeries, zoomWindow,
      activeChart, lastExpandedChart: expandedChart, biddingOffset, selectedUnitId,
    }));
  }, [province, startDate, endDate, globalGranularity, priceCfg, loadCfg, renCfg, spaceCfg, priceSeries, loadSeries, renSeries, spaceSeries, zoomWindow, activeChart, expandedChart, biddingOffset, selectedUnitId]);

  // 各图数据
  const priceForecast = useMemo(() => getForecastSeries("price", startDate, endDate, priceCfg.granularity), [startDate, endDate, priceCfg.granularity]);
  const loadForecast = useMemo(() => getForecastSeries("load", startDate, endDate, loadCfg.granularity), [startDate, endDate, loadCfg.granularity]);
  const renForecast = useMemo(() => getForecastSeries("renewable", startDate, endDate, renCfg.granularity), [startDate, endDate, renCfg.granularity]);
  const spaceForecast = useMemo(() => getForecastSeries("space", startDate, endDate, spaceCfg.granularity), [startDate, endDate, spaceCfg.granularity]);
  const priceDs = useMemo(() => ({ price: priceForecast.map((p) => ({ ...p, dayAhead: p.predicted, realtime: p.actual, spread: p.deviation, cleared: Math.max(400, Math.round(p.predicted * 2.2)) })), xKey: priceCfg.granularity === "day" ? "dayLabel" as const : "label" as const, xInterval: priceCfg.granularity === "15min" ? 15 : priceCfg.granularity === "hour" ? 5 : 0, periodLabel: (p: any) => p.date ? `${p.date} · 时段 ${p.periodRange}` : "" }), [priceForecast, priceCfg.granularity]);
  const loadDs = useMemo(() => ({ load: loadForecast, xKey: loadCfg.granularity === "day" ? "dayLabel" as const : "label" as const, xInterval: loadCfg.granularity === "15min" ? 15 : loadCfg.granularity === "hour" ? 5 : 0, periodLabel: (p: any) => p.date ? `${p.date} · 时段 ${p.periodRange}` : "" }), [loadForecast, loadCfg.granularity]);
  const renDs = useMemo(() => ({ renewable: renForecast, xKey: renCfg.granularity === "day" ? "dayLabel" as const : "label" as const, xInterval: renCfg.granularity === "15min" ? 15 : renCfg.granularity === "hour" ? 5 : 0, periodLabel: (p: any) => p.date ? `${p.date} · 时段 ${p.periodRange}` : "" }), [renForecast, renCfg.granularity]);
  const spaceDs = useMemo(() => ({ space: spaceForecast.map((p) => ({ ...p, warning: p.predicted < SPACE_WARN_THRESHOLD })), xKey: spaceCfg.granularity === "day" ? "dayLabel" as const : "label" as const, xInterval: spaceCfg.granularity === "15min" ? 15 : spaceCfg.granularity === "hour" ? 5 : 0, periodLabel: (p: any) => p.date ? `${p.date} · 时段 ${p.periodRange}` : "" }), [spaceForecast, spaceCfg.granularity]);
  const biddingOffsetDs = useMemo(() => {
    const base = biddingSpaceByOffset[biddingOffset];
    const data = spaceCfg.granularity === "15min" ? base : spaceCfg.granularity === "hour" ? aggregateToHour(base, ["load", "renewable", "space"] as any).map((s: any) => ({ ...s, warning: s.space < SPACE_WARN_THRESHOLD })) : [{ ...base[0], label: "24小时", periodRange: "1-96", load: Math.round(base.reduce((sum, p) => sum + p.load, 0) / base.length), renewable: Math.round(base.reduce((sum, p) => sum + p.renewable, 0) / base.length), space: Math.round(base.reduce((sum, p) => sum + p.space, 0) / base.length), warning: base.some((p) => p.warning) }];
    return { space: data, xKey: spaceCfg.granularity === "hour" ? "hourLabel" as const : "label" as const, xInterval: spaceCfg.granularity === "15min" ? 15 : spaceCfg.granularity === "hour" ? 5 : 0, periodLabel: (p: any) => `时段 ${p.periodRange ?? p.period}` };
  }, [biddingOffset, spaceCfg.granularity]);
  // 边界使用全局粒度
  const boundaryDs = useMemo(() => getDataset(globalGranularity), [globalGranularity]);

  // 负荷偏差摘要（基于 96 点原始数据）
  const loadStats = useMemo(() => {
    const devs = load96.map((l) => l.deviation);
    const maxPos = Math.max(...devs);
    const maxNeg = Math.min(...devs);
    const avg = devs.reduce((s, d) => s + d, 0) / devs.length;
    const avgPct = (devs.reduce((s, d, i) => s + Math.abs(d / load96[i].predicted), 0) / devs.length) * 100;
    return {
      maxPos,
      maxNeg,
      avg: Math.round(avg),
      avgPct: avgPct.toFixed(2),
    };
  }, []);

  // 新能源占负荷比例（峰值时刻）
  const renRatio = useMemo(() => {
    const ratios = load96.map((l, i) => renewable96[i].total / l.predicted);
    const peak = Math.max(...ratios);
    const avg = ratios.reduce((s, r) => s + r, 0) / ratios.length;
    return { peak: (peak * 100).toFixed(1), avg: (avg * 100).toFixed(1) };
  }, []);

  const weatherSignals = useMemo(() => weather24.filter((row) => row.alert !== "无").slice(0, 4), []);
  const forecastSummary = useMemo(() => [
    { label: "负荷预测", stat: summarizeForecast(loadForecast), unit: "MW", source: "预测模块", lag: "实际滞后约15-60分钟" },
    { label: "新能源出力预测", stat: summarizeForecast(renForecast), unit: "MW", source: "预测模块", lag: "场站实测回传后校验" },
    { label: "电价预测", stat: summarizeForecast(priceForecast), unit: "元/MWh", source: "预测模块", lag: "出清披露后对照" },
  ], [loadForecast, renForecast, priceForecast]);
  const monthlyProfile = useMemo(() => getThermalMonthlyProfile(selectedUnitId), [selectedUnitId]);
  const highRealtime = useMemo(() => thermalUnits.slice().sort((a, b) => b.realtimeLoadRate - a.realtimeLoadRate).slice(0, 8), []);
  const highRolling = useMemo(() => thermalUnits.slice().sort((a, b) => b.rollingAvgLoadRate - a.rollingAvgLoadRate).slice(0, 8), []);
  const overlapUnits = useMemo(() => new Set(highRealtime.map((u) => u.id).filter((id) => highRolling.some((u) => u.id === id))), [highRealtime, highRolling]);
  const filteredReports = useMemo(() => alertStatus === "全部" ? ruleAlertReports : ruleAlertReports.filter((r) => r.status === alertStatus), [alertStatus]);
  const boundaryMeta: Record<string, { sourceType: "公开披露" | "预测推导" | "插件增强"; note: string }> = {
    联络线外送计划: { sourceType: "公开披露", note: "公开披露版，非实时终端" },
    "皖南-皖北断面限额": { sourceType: "插件增强", note: "当前为示例口径，实时断面待插件数据" },
    必开机组容量: { sourceType: "公开披露", note: "调度披露后人工/接口同步" },
    必停机组容量: { sourceType: "公开披露", note: "检修计划披露版" },
    非市场化机组出力: { sourceType: "预测推导", note: "规则推导，待补真实来源" },
    备用容量: { sourceType: "插件增强", note: "满血版依赖实时/插件数据" },
  };

  return (
    <MarketCursorProvider>
      <div className="px-6 py-5 space-y-4 min-h-[calc(100vh-5rem)]">
        <header className="rounded-lg border bg-card p-4 shadow-notion">
          <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap">
            <h1 className="text-lg font-semibold shrink-0">交易员判断工作台</h1>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-xs text-muted-foreground">省份</span>
              <Select value={province} onValueChange={(v) => setProvince(v as ProvinceCode)}>
                <SelectTrigger className="h-8 w-28 text-xs"><MapPin className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="anhui">安徽</SelectItem>
                  <SelectItem value="shandong">山东</SelectItem>
                  <SelectItem value="guangdong">广东</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">日期范围</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs" />
              <span className="text-xs text-muted-foreground">-</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs" />
              <div className="flex rounded-md border overflow-hidden text-xs h-8 bg-background">
                {[{ d: 1, label: "今日" }, { d: 2, label: "近2日" }, { d: 4, label: "近4日" }, { d: 7, label: "近7日" }].map((item) => (
                  <button key={item.d} onClick={() => applyQuickRange(item.d)} className="px-2 hover:bg-secondary">{item.label}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">粒度</span>
              <div className="flex rounded-md border overflow-hidden text-xs h-8 bg-background">
                <button
                  onClick={() => setGlobalAll("15min")}
                  className={`px-3 ${globalGranularity === "15min" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                >15分</button>
                <button
                  onClick={() => setGlobalAll("hour")}
                  className={`px-3 ${globalGranularity === "hour" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                >1小时</button>
                <button
                  onClick={() => setGlobalAll("day")}
                  className={`px-3 ${globalGranularity === "day" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                >24小时</button>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[11px] text-muted-foreground">
              缩放窗口 {zoomWindow.start}% - {zoomWindow.end}%
            </div>
            <div className="flex items-center gap-2 text-[11px] shrink-0 ml-auto">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> 更新 10:32
              </span>
              <span className="px-1.5 py-0.5 rounded bg-success/10 text-success">公开披露</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            口径：用于交易前判断，不表达为实时行情终端；顶部日期范围、快捷项和粒度是四张主图唯一时间控制源。
          </p>
        </header>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-3 min-w-0">
            <ChartCard
              index={1}
              chartId="bidding-space"
              title="竞价空间判断"
              caption={`默认 ${biddingOffset}；D-2 预测模型完成后，再将默认切换为 D-2`}
              granularity={spaceCfg.granularity}
              onGranularityChange={(g) => setSpaceCfg({ ...spaceCfg, granularity: g })}
              range={spaceCfg.range}
              onRangeChange={(r) => applyChartRange(r, setSpaceCfg)}
              showLegend={spaceCfg.showLegend}
              onToggleLegend={() => setSpaceCfg({ ...spaceCfg, showLegend: !spaceCfg.showLegend })}
              active={activeChart === "bidding-space"}
              expanded={expandedChart === "bidding-space"}
              onActivate={() => setActiveChart("bidding-space")}
              onExpand={() => openChartPage("bidding-space")}
              onExpandedChange={(open) => setExpandedChart(open ? "bidding-space" : null)}
              onZoomWheel={(deltaY) => handleZoomWheel(deltaY, "bidding-space")}
              onResetZoom={() => resetZoom("bidding-space")}
              tableHeader={["时段", "总负荷预测", "新能源预测", "竞价空间", "状态"]}
              tableRows={biddingOffsetDs.space.map((p: any) => [p.label ?? p.hourLabel, p.load, p.renewable, p.space, p.warning ? "预警" : "正常"])}
              csvFilename="bidding-space-priority.csv"
              csvRows={[["时段", "总负荷预测", "新能源预测", "竞价空间", "预警"], ...biddingOffsetDs.space.map((p: any) => [p.label ?? p.hourLabel, p.load, p.renewable, p.space, p.warning ? 1 : 0])]}
              footer={<div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]"><span className="text-muted-foreground">竞价空间 = 总负荷预测 − 新能源预测；当前为 mock 规则框架版。</span><SourceBadge label="规则计算" /><SourceBadge label="待确认数据源" /></div>}
            >
              <div className="mb-2 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">预测日</span>
                <Select value={biddingOffset} onValueChange={(v) => setBiddingOffset(v as BiddingDayOffset)}>
                  <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["D-1", "D-2", "D-3", "D-5"] as BiddingDayOffset[]).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-[11px] text-muted-foreground">当前默认 D-1</span>
              </div>
              <BiddingSpaceChart data={zoomData(biddingOffsetDs.space)} xKey={biddingOffsetDs.xKey} xInterval={biddingOffsetDs.xInterval} periodLabel={biddingOffsetDs.periodLabel} showLegend={spaceCfg.showLegend} threshold={SPACE_WARN_THRESHOLD} visibleSeries={{ predicted: false, actual: false, deviation: false }} />
            </ChartCard>
          </div>

          <aside className="xl:sticky xl:top-4 xl:self-start rounded-lg border bg-card p-3 shadow-notion overflow-x-auto xl:overflow-visible">
            <h2 className="text-sm font-semibold mb-2">预测快照</h2>
            <div className="flex xl:flex-col gap-2 min-w-max xl:min-w-0">
              {forecastSummary.map((card) => (
                <div key={card.label} className="w-[220px] xl:w-full rounded-md border bg-background px-3 py-2 shrink-0">
                  <p className="text-xs font-medium">{card.label}</p>
                  <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] text-muted-foreground">
                    <span>最高 <b className="font-mono text-foreground">{card.stat.maxPredicted}</b></span>
                    <span>最低 <b className="font-mono text-foreground">{card.stat.minPredicted}</b></span>
                    <span>均值 <b className="font-mono text-foreground">{card.stat.avgPredicted}</b></span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed">单位：{card.unit} · 数据时点：{endDate} · {card.source} · {card.lag}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className="rounded-lg border bg-card p-4 shadow-notion space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold">市场运行边界</h2>
              <p className="text-[11px] text-muted-foreground mt-1">公开披露 / 规则计算口径；实时和插件增强字段仍待补数据源。</p>
            </div>
            <SourceBadge label="规则计算" />
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border bg-background p-3">
              <p className="text-[11px] text-muted-foreground">现货火电机组容量</p>
              <p className="mt-1 text-lg font-mono font-semibold">{marketBoundaryCore.thermalCapacity.total.toLocaleString()} MW</p>
              <p className="text-[10px] text-muted-foreground">在网 {marketBoundaryCore.thermalCapacity.online.toLocaleString()} + 检修 {marketBoundaryCore.thermalCapacity.maintenance.toLocaleString()}；{marketBoundaryCore.thermalCapacity.note}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-[11px] text-muted-foreground">联络线送出计划</p>
              <p className="mt-1 text-lg font-mono font-semibold">{boundaryRows[0].value}</p>
              <BoundaryMiniChart data={boundaryDs.boundary as any[]} dataKey="tieLine" color={C_PRIMARY} />
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-[11px] text-muted-foreground">必开 / 必停</p>
              <p className="mt-1 text-sm font-mono font-semibold">必开 {marketBoundaryCore.mustRun.mw} MW / {marketBoundaryCore.mustRun.units} 台</p>
              <p className="text-sm font-mono font-semibold">必停 {marketBoundaryCore.mustStop.mw} MW / {marketBoundaryCore.mustStop.units} 台</p>
            </div>
            <div className="rounded-md border bg-background p-3 space-y-1">
              <p className="text-[11px] text-muted-foreground">正备用 / 负备用</p>
              {marketBoundaryCore.reserve.map((r) => (
                <p key={r.name} className="text-[11px]"><span className="font-medium">{r.name}</span> <span className="font-mono">{r.value} MW</span> <span className="text-muted-foreground">D-1 {r.d1Change > 0 ? "+" : ""}{r.d1Change} / 月 {r.monthChange > 0 ? "+" : ""}{r.monthChange}</span></p>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-notion space-y-3">
          <h2 className="text-sm font-semibold">火电机组实时出力</h2>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="全部火电机组总出力" value={`${thermalRealtimeSummary.totalOutput.toLocaleString()} MW`} />
            <Stat label="当前实时点平均负载率" value={`${thermalRealtimeSummary.avgRealtimeLoadRate}%`} />
            <Stat label="全天滚动实际平均负载率" value={`${thermalRealtimeSummary.avgRollingLoadRate}%`} />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <LoadRateTable title="实时负载率排行" rows={highRealtime} metric="realtimeLoadRate" overlap={overlapUnits} />
            <LoadRateTable title="全天滚动平均负载率排行" rows={highRolling} metric="rollingAvgLoadRate" overlap={overlapUnits} />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-notion space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-semibold">机组月报</h2>
            <div className="flex items-center gap-2">
              <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{thermalUnits.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
              <button onClick={() => downloadCsvLikeExcel(monthlyProfile)} className="h-8 rounded-md bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90">导出 Excel</button>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
            <div className="rounded-md border bg-background p-3"><p className="text-[11px] text-muted-foreground">全月平均负载率 · {monthlyProfile.granularity}</p><p className="mt-2 text-2xl font-mono font-semibold">{monthlyProfile.monthlyAvgLoadRate}%</p><p className="text-[10px] text-muted-foreground">mock 70 个火电机组，后续接入月报数据源。</p></div>
            <BoundaryMiniChart data={monthlyProfile.points} dataKey="loadRate" color={C_WARNING} />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-notion space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-semibold">规则预警报告中心</h2>
            <Select value={alertStatus} onValueChange={setAlertStatus}><SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger><SelectContent>{["全部", "待处理", "已复盘", "已忽略"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          </div>
          <ReportTable rows={filteredReports} />
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-notion">
          <h2 className="text-sm font-semibold mb-2">功率预测</h2>
          <div className="grid gap-2 md:grid-cols-3">{powerForecastCards.map((c) => <div key={c.name} className="rounded-md border bg-background p-3"><p className="text-[11px] text-muted-foreground">{c.name}</p><p className="mt-1 text-lg font-mono font-semibold">{c.value.toLocaleString()} {c.unit}</p><p className="text-[10px] text-muted-foreground">{c.source} · 入口预留</p></div>)}</div>
        </section>

        <div className="space-y-3">

        {/* 1. 电价与价差 */}
        <ChartCard
          index={1}
          chartId="price-spread"
          title="电价与价差"
          caption="日前 vs 实时 vs 价差 + 出清电量"
          granularity={priceCfg.granularity}
          onGranularityChange={(g) => setPriceCfg({ ...priceCfg, granularity: g })}
          range={priceCfg.range}
          onRangeChange={(r) => applyChartRange(r, setPriceCfg)}
          showLegend={priceCfg.showLegend}
          onToggleLegend={() => setPriceCfg({ ...priceCfg, showLegend: !priceCfg.showLegend })}
          active={activeChart === "price-spread"}
          expanded={expandedChart === "price-spread"}
          onActivate={() => setActiveChart("price-spread")}
          onExpand={() => openChartPage("price-spread")}
          onExpandedChange={(open) => setExpandedChart(open ? "price-spread" : null)}
          onZoomWheel={(deltaY) => handleZoomWheel(deltaY, "price-spread")}
          onResetZoom={() => resetZoom("price-spread")}
          tableHeader={["时段", "日前(元/MWh)", "实时(元/MWh)", "价差", "出清(MWh)"]}
          tableRows={priceDs.price.map((p: any) => [
            p.label ?? p.hourLabel, p.dayAhead, p.realtime, p.spread, p.cleared,
          ])}
          csvFilename="price-spread.csv"
          csvRows={[
            ["时段", "日前", "实时", "价差", "出清电量"],
            ...priceDs.price.map((p: any) => [p.label ?? p.hourLabel, p.dayAhead, p.realtime, p.spread, p.cleared]),
          ]}
          footer={
            <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px]">
              {[
                { k: "dayAhead", label: "日前电价", color: C_PRIMARY },
                { k: "realtime", label: "实时电价", color: "hsl(var(--destructive))" },
                { k: "spread", label: "价差", color: C_WARNING },
                { k: "cleared", label: "出清电量", color: "hsl(var(--muted-foreground))" },
              ].map((s) => (
                <label key={s.k} className="inline-flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={(priceSeries as any)[s.k]}
                    onChange={(e) => setPriceSeries({ ...priceSeries, [s.k]: e.target.checked })}
                    className="h-3 w-3"
                  />
                  <span className="inline-block h-2 w-3 rounded-sm" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.label}</span>
                </label>
              ))}
              <SourceBadge label="公开API" />
              <SourceBadge label="规则计算" />
              <span className="text-muted-foreground ml-auto">价差 = 日前电价 − 实时电价</span>
              <span className="text-muted-foreground">数据时点：{endDate} · 滞后披露/规则计算</span>
            </div>
          }
        >
          <PriceSpreadChart
            data={zoomData(priceDs.price)}
            xKey={priceDs.xKey}
            xInterval={priceDs.xInterval}
            periodLabel={priceDs.periodLabel}
            showLegend={priceCfg.showLegend}
            visibleSeries={priceSeries}
            forecastMode="all"
          />
        </ChartCard>

        <section className="rounded-lg border bg-card p-4 shadow-notion space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold">电价预测联动</h3>
              <p className="text-[11px] text-muted-foreground mt-1">补充预测电价、预测偏差与候选影响因子；当前为规则框架版，不代表已确认真实原因。</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <SourceBadge label="公开API" />
              <SourceBadge label="规则计算" />
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">时段</th>
                    <th className="text-right px-3 py-2 font-medium">日前电价</th>
                    <th className="text-right px-3 py-2 font-medium">实时电价</th>
                    <th className="text-right px-3 py-2 font-medium">价差</th>
                    <th className="text-right px-3 py-2 font-medium">预测电价</th>
                    <th className="text-right px-3 py-2 font-medium">预测偏差</th>
                    <th className="text-left px-3 py-2 font-medium">候选影响因子</th>
                  </tr>
                </thead>
                <tbody>
                  {priceForecastLink24.slice(0, 8).map((row) => (
                    <tr key={row.hour} className="border-t hover:bg-secondary/30">
                      <td className="px-3 py-2 font-mono">{row.hourLabel}</td>
                      <td className="px-3 py-2 text-right font-mono">{row.dayAhead}</td>
                      <td className="px-3 py-2 text-right font-mono">{row.realtime}</td>
                      <td className={`px-3 py-2 text-right font-mono ${row.spread >= 0 ? "text-destructive" : "text-success"}`}>{row.spread >= 0 ? "+" : ""}{row.spread}</td>
                      <td className="px-3 py-2 text-right font-mono">{row.predictedPrice}</td>
                      <td className={`px-3 py-2 text-right font-mono ${row.forecastDeviation >= 0 ? "text-destructive" : "text-success"}`}>{row.forecastDeviation >= 0 ? "+" : ""}{row.forecastDeviation}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.candidateFactor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2">
              <div className="rounded-md border bg-background p-3 space-y-2">
                <p className="text-xs font-medium">气象联动提示</p>
                {weatherSignals.map((item) => (
                  <div key={item.hour} className="text-[11px] text-muted-foreground leading-relaxed">
                    <span className="font-mono text-foreground mr-2">{item.hourLabel}</span>
                    {item.alert} · 风速 {item.windSpeed.toFixed(1)} m/s · 辐照度 {item.irradiance} · 云量 {item.cloudCover}%
                  </div>
                ))}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <SourceBadge label="公开API" />
                  <SourceBadge label="页面抓取" />
                </div>
              </div>
              <div className="rounded-md border bg-background p-3 space-y-2">
                <p className="text-xs font-medium">关系链路</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">气象 → 新能源预测 → 市场数据 → 竞价空间 → 电价关系 → 策略</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">候选影响因子只做联动提示，不代表系统已确认真实原因。</p>
                <SourceBadge label="规则计算" />
              </div>
            </div>
          </div>
        </section>

        {/* 1.1 价差影响因子对照（SP1：仅展示已确认数据列） */}
        <SpreadFactorMatrix granularity={priceCfg.granularity} />
        <ChartCard
          index={2}
          chartId="load-forecast"
          title="负荷预测 vs 实际"
          caption="预测/实际同图对比 + 偏差曲线"
          granularity={loadCfg.granularity}
          onGranularityChange={(g) => setLoadCfg({ ...loadCfg, granularity: g })}
          range={loadCfg.range}
          onRangeChange={(r) => applyChartRange(r, setLoadCfg)}
          showLegend={loadCfg.showLegend}
          onToggleLegend={() => setLoadCfg({ ...loadCfg, showLegend: !loadCfg.showLegend })}
          active={activeChart === "load-forecast"}
          expanded={expandedChart === "load-forecast"}
          onActivate={() => setActiveChart("load-forecast")}
          onExpand={() => openChartPage("load-forecast")}
          onExpandedChange={(open) => setExpandedChart(open ? "load-forecast" : null)}
          onZoomWheel={(deltaY) => handleZoomWheel(deltaY, "load-forecast")}
          onResetZoom={() => resetZoom("load-forecast")}
          tableHeader={["时段", "预测(MW)", "实际(MW)", "偏差", "偏差率"]}
          tableRows={loadDs.load.map((p: any) => [
            p.label ?? p.hourLabel, p.predicted, p.actual, p.deviation, `${((p.deviation / p.predicted) * 100).toFixed(2)}%`,
          ])}
          csvFilename="load-forecast.csv"
          csvRows={[
            ["时段", "预测", "实际", "偏差", "偏差率%"],
            ...loadDs.load.map((p: any) => [p.label ?? p.hourLabel, p.predicted, p.actual, p.deviation, ((p.deviation / p.predicted) * 100).toFixed(2)]),
          ]}
          footer={
            <div className="mt-2 space-y-2 text-[11px]">
              <SeriesToggles
                series={loadSeries}
                onChange={setLoadSeries}
                items={[
                  { k: "predicted", label: "预测负荷", color: C_PRIMARY },
                  { k: "actual", label: "实际负荷", color: C_PRIMARY },
                  { k: "deviation", label: "偏差", color: "hsl(var(--destructive))" },
                ]}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Stat label="最大正偏差" value={`+${loadStats.maxPos} MW`} tone="destructive" />
                <Stat label="最大负偏差" value={`${loadStats.maxNeg} MW`} tone="success" />
                <Stat label="平均偏差" value={`${loadStats.avg > 0 ? "+" : ""}${loadStats.avg} MW`} />
                <Stat label="平均偏差率" value={`${loadStats.avgPct}%`} />
              </div>
            </div>
          }
        >
          <LoadForecastChart
            data={zoomData(loadDs.load)}
            xKey={loadDs.xKey}
            xInterval={loadDs.xInterval}
            periodLabel={loadDs.periodLabel}
            showLegend={loadCfg.showLegend}
            visibleSeries={loadSeries}
            forecastMode="all"
          />
        </ChartCard>

        {/* 3. 新能源出力 */}
        <ChartCard
          index={3}
          chartId="renewable-output"
          title="新能源出力"
          caption="风电 + 光伏 + 新能源总出力"
          granularity={renCfg.granularity}
          onGranularityChange={(g) => setRenCfg({ ...renCfg, granularity: g })}
          range={renCfg.range}
          onRangeChange={(r) => applyChartRange(r, setRenCfg)}
          showLegend={renCfg.showLegend}
          onToggleLegend={() => setRenCfg({ ...renCfg, showLegend: !renCfg.showLegend })}
          active={activeChart === "renewable-output"}
          expanded={expandedChart === "renewable-output"}
          onActivate={() => setActiveChart("renewable-output")}
          onExpand={() => openChartPage("renewable-output")}
          onExpandedChange={(open) => setExpandedChart(open ? "renewable-output" : null)}
          onZoomWheel={(deltaY) => handleZoomWheel(deltaY, "renewable-output")}
          onResetZoom={() => resetZoom("renewable-output")}
          tableHeader={["时段", "预测(MW)", "实际(MW)", "偏差", "偏差率"]}
          tableRows={renDs.renewable.map((p: any) => [p.label ?? p.hourLabel, p.predicted, p.actual, p.deviation, `${p.deviationPct}%`])}
          csvFilename="renewable.csv"
          csvRows={[
            ["时段", "预测", "实际", "偏差", "偏差率"],
            ...renDs.renewable.map((p: any) => [p.label ?? p.hourLabel, p.predicted, p.actual, p.deviation, p.deviationPct]),
          ]}
          footer={
            <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px]">
              {[
                { k: "predicted", label: "预测新能源", color: C_PRIMARY },
                { k: "actual", label: "实际新能源", color: C_SUCCESS },
                { k: "deviation", label: "偏差", color: "hsl(var(--destructive))" },
              ].map((s) => (
                <label key={s.k} className="inline-flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={(renSeries as any)[s.k]}
                    onChange={(e) => setRenSeries({ ...renSeries, [s.k]: e.target.checked })}
                    className="h-3 w-3"
                  />
                  <span className="inline-block h-2 w-3 rounded-sm" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.label}</span>
                </label>
              ))}
              <span className="text-muted-foreground ml-auto">
                新能源占负荷比例 · 峰值 <span className="font-mono text-foreground">{renRatio.peak}%</span>
                {" / "}日均 <span className="font-mono text-foreground">{renRatio.avg}%</span>
              </span>
              <SourceBadge label="公开API" />
              <SourceBadge label="待确认数据源" />
            </div>
          }
        >
          <RenewableChart
            data={zoomData(renDs.renewable)}
            xKey={renDs.xKey}
            xInterval={renDs.xInterval}
            periodLabel={renDs.periodLabel}
            showLegend={renCfg.showLegend}
            visibleSeries={renSeries}
            forecastMode="all"
          />
        </ChartCard>

        {/* 4. 竞价空间 */}
        <ChartCard
          index={4}
          chartId="bidding-space"
          title="竞价空间"
          caption={`公式：竞价空间 = 总负荷预测 − 新能源预测 · 预警阈值 ${SPACE_WARN_THRESHOLD} MW`}
          granularity={spaceCfg.granularity}
          onGranularityChange={(g) => setSpaceCfg({ ...spaceCfg, granularity: g })}
          range={spaceCfg.range}
          onRangeChange={(r) => applyChartRange(r, setSpaceCfg)}
          showLegend={spaceCfg.showLegend}
          onToggleLegend={() => setSpaceCfg({ ...spaceCfg, showLegend: !spaceCfg.showLegend })}
          active={activeChart === "bidding-space"}
          expanded={expandedChart === "bidding-space"}
          onActivate={() => setActiveChart("bidding-space")}
          onExpand={() => openChartPage("bidding-space")}
          onExpandedChange={(open) => setExpandedChart(open ? "bidding-space" : null)}
          onZoomWheel={(deltaY) => handleZoomWheel(deltaY, "bidding-space")}
          onResetZoom={() => resetZoom("bidding-space")}
          tableHeader={["时段", "预测(MW)", "实际(MW)", "偏差", "状态"]}
          tableRows={spaceDs.space.map((p: any) => [
            p.label ?? p.hourLabel, p.predicted, p.actual, p.deviation, p.warning ? "⚠️ 预警" : "正常",
          ])}
          csvFilename="bidding-space.csv"
          csvRows={[
            ["时段", "预测", "实际", "偏差", "预警"],
            ...spaceDs.space.map((p: any) => [p.label ?? p.hourLabel, p.predicted, p.actual, p.deviation, p.warning ? 1 : 0]),
          ]}
          footer={
            <div className="mt-2 text-[11px]">
              <SeriesToggles
                series={spaceSeries}
                onChange={setSpaceSeries}
                items={[
                  { k: "predicted", label: "预测竞价空间", color: C_PRIMARY },
                  { k: "actual", label: "实际竞价空间", color: C_SUCCESS },
                  { k: "deviation", label: "偏差", color: "hsl(var(--destructive))" },
                ]}
              />
            </div>
          }
        >
          <BiddingSpaceChart
            data={zoomData(spaceDs.space)}
            xKey={spaceDs.xKey}
            xInterval={spaceDs.xInterval}
            periodLabel={spaceDs.periodLabel}
            showLegend={spaceCfg.showLegend}
            threshold={SPACE_WARN_THRESHOLD}
            visibleSeries={spaceSeries}
            forecastMode="all"
          />
        </ChartCard>

        {/* 5. 市场运行与边界 */}
        <section className="rounded-lg shadow-notion bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-mono text-muted-foreground">#5</span>
              <h3 className="text-sm font-semibold">市场运行与边界</h3>
              <span className="text-[11px] text-muted-foreground">公开披露版；实时/插件增强字段待补血</span>
            </div>
            <button
              onClick={() => setBoundaryExpanded((v) => !v)}
              className="text-[11px] text-primary inline-flex items-center gap-1 hover:underline"
            >
              {boundaryExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {boundaryExpanded ? "收起明细" : "展开 96 点明细"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {boundaryRows.map((row) => {
              const meta = boundaryMeta[row.item] ?? { sourceType: "公开披露" as const, note: "公开披露版" };
              return (
              <div key={row.item} className="p-2.5 rounded-md border bg-background">
                <p className="text-[11px] text-muted-foreground mb-0.5">{row.item}</p>
                <p className="text-sm font-semibold">{row.value}</p>
                <p className="text-[10px] text-muted-foreground">{row.note}</p>
                <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                  <span className="rounded bg-secondary px-1.5 py-0.5">{meta.sourceType}</span>
                  <span>{meta.note}</span>
                </div>
                {row.trendKey && (
                  <BoundaryMiniChart
                    data={boundaryDs.boundary as any[]}
                    dataKey={row.trendKey}
                    color={row.trendKey === "sectionLoad" ? "hsl(var(--warning))" : C_PRIMARY}
                  />
                )}
              </div>
            );})}
          </div>

          {boundaryExpanded && (
            <div className="mt-3 max-h-72 overflow-auto border rounded">
              <table className="w-full text-xs">
                <thead className="bg-secondary sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-1.5 font-medium">时段</th>
                    <th className="text-right px-3 py-1.5 font-medium">联络线(MW)</th>
                    <th className="text-right px-3 py-1.5 font-medium">断面负载率</th>
                    <th className="text-right px-3 py-1.5 font-medium">正备用</th>
                    <th className="text-right px-3 py-1.5 font-medium">负备用</th>
                  </tr>
                </thead>
                <tbody>
                  {(boundaryDs.boundary as any[]).map((p, i) => (
                    <tr key={i} className="border-t hover:bg-secondary/40">
                      <td className="px-3 py-1 font-mono">{p.label ?? p.hourLabel}</td>
                      <td className="px-3 py-1 font-mono text-right">{p.tieLine.toLocaleString()}</td>
                      <td className={`px-3 py-1 font-mono text-right ${p.sectionLoad >= 75 ? "text-destructive" : ""}`}>
                        {p.sectionLoad}%
                      </td>
                      <td className="px-3 py-1 font-mono text-right">{p.reservePos}</td>
                      <td className="px-3 py-1 font-mono text-right">{p.reserveNeg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        </div>
      </div>
    </MarketCursorProvider>
  );
}

// ============================================================
// 规则预警 mock (SP1)
// 仅保留可基于公开数据 + 预设阈值推导的预警类型：
//   实时价差扩大 / 断面接近限额 / 备用偏紧 / 必开必停状态提醒
// 「新能源预测偏差」类预警 SP1 暂不展示（待补实际数据来源）
// ============================================================
interface RuleWarning {
  id: string;
  title: string;
  period: string;
  current: string;
  threshold: string;
  thresholdSource: "业务阈值" | "历史P90-P95" | "官方预警" | "待配置";
  source: DataSourceTag;
  method: string;
  action: string;
  level: "high" | "medium";
}

const ruleWarnings: RuleWarning[] = [
  {
    id: "rw-1",
    title: "实时价差扩大",
    period: "18:00-20:00",
    current: "当前价差 +47 元/MWh",
    threshold: "超过预设阈值 ±30 元/MWh",
    thresholdSource: "业务阈值",
    source: "公开API",
    method: "日前电价 − 实时电价，按当前粒度聚合",
    action: "建议关注晚间申报策略",
    level: "high",
  },
  {
    id: "rw-2",
    title: "断面接近限额",
    period: "皖南-皖北断面",
    current: "当前负载 78%",
    threshold: "接近预警阈值 80%",
    thresholdSource: "历史P90-P95",
    source: "公开API",
    method: "断面实时负载率与业务阈值比对",
    action: "建议关注晚高峰送电安排",
    level: "medium",
  },
  {
    id: "rw-3",
    title: "备用偏紧",
    period: "19:30-21:00",
    current: "正备用 1,820 MW",
    threshold: "低于预设阈值 2,000 MW",
    thresholdSource: "官方预警",
    source: "公开API",
    method: "正备用容量低于业务阈值触发",
    action: "建议预留响应空间",
    level: "medium",
  },
  {
    id: "rw-4",
    title: "必开机组状态提醒",
    period: "全日",
    current: "必开 6 台 / 必停 2 台",
    threshold: "较 D-1 新增必开 1 台",
    thresholdSource: "待配置",
    source: "规则计算",
    method: "必开必停台数与 D-1 计划差异比对",
    action: "建议复核中长期匹配",
    level: "medium",
  },
];

function LoadRateTable({ title, rows, metric, overlap }: { title: string; rows: typeof thermalUnits; metric: "realtimeLoadRate" | "rollingAvgLoadRate"; overlap: Set<string> }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="bg-secondary/50 px-3 py-2 text-xs font-medium">{title}</div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map((u, index) => (
            <tr key={u.id} className="border-t hover:bg-secondary/30">
              <td className="px-3 py-1.5 font-mono text-muted-foreground">#{index + 1}</td>
              <td className="px-3 py-1.5">{u.name}{overlap.has(u.id) && <span className="ml-2 rounded bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">同时高负载</span>}</td>
              <td className="px-3 py-1.5 text-right font-mono">{u[metric]}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportTable({ rows }: { rows: typeof ruleAlertReports }) {
  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full min-w-[980px] text-xs">
        <thead className="bg-secondary/50">
          <tr>{["预警时间", "规则名称", "触发原因", "当前值", "阈值", "数据来源", "影响对象", "建议动作", "状态"].map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.time}-${r.ruleName}`} className="border-t hover:bg-secondary/30">
              <td className="px-3 py-2 font-mono">{r.time}</td><td className="px-3 py-2">{r.ruleName}</td><td className="px-3 py-2 text-muted-foreground">{r.reason}</td><td className="px-3 py-2 font-mono">{r.current}</td><td className="px-3 py-2">{r.threshold}</td><td className="px-3 py-2">{r.source}</td><td className="px-3 py-2">{r.target}</td><td className="px-3 py-2">{r.action}</td><td className="px-3 py-2"><span className="rounded bg-secondary px-1.5 py-0.5">{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function downloadCsvLikeExcel(profile: ReturnType<typeof getThermalMonthlyProfile>) {
  const rows = [["机组", "粒度", "时段", "负载率%"], ...profile.points.map((p) => [profile.unit.name, profile.granularity, p.label, p.loadRate])];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${profile.unit.name}-月报.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "destructive" | "success" }) {
  const cls =
    tone === "destructive" ? "text-destructive" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <div className="p-2 rounded border bg-background">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-mono font-semibold ${cls}`}>{value}</p>
    </div>
  );
}

function SeriesToggles({
  series,
  onChange,
  items,
}: {
  series: Record<string, boolean>;
  onChange: (next: any) => void;
  items: Array<{ k: string; label: string; color: string }>;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {items.map((s) => (
        <label key={s.k} className="inline-flex items-center gap-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={series[s.k]}
            onChange={(e) => onChange({ ...series, [s.k]: e.target.checked })}
            className="h-3 w-3"
          />
          <span className="inline-block h-2 w-3 rounded-sm" style={{ background: s.color }} />
          <span className="text-muted-foreground">{s.label}</span>
        </label>
      ))}
    </div>
  );
}

function SourceBadge({ label }: { label: DataSourceTag }) {
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{label}</span>;
}
