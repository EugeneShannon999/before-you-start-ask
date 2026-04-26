import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronDown,
  ChevronRight,
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
  SPACE_WARN_THRESHOLD,
  load96,
  renewable96,
  priceForecastLink24,
  weather24,
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
}

const today = "2025-07-15";
const rangeDays: Record<RangeKey, number> = { "1d": 1, "2d": 2, "4d": 4, "7d": 7 };
type MainChartId = "price-spread" | "load-forecast" | "renewable-output" | "bidding-space";
const STORAGE_KEY = "market-board-interaction-state:v1";

const initialCfg = (g: Granularity): ChartCfg => ({ granularity: g, range: "1d", showLegend: true });

export default function MarketInfo() {
  const { province, setProvince } = useProvince();
  const saved = useMemo(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
  }, []);
  const [globalGranularity, setGlobalGranularity] = useState<Granularity>(saved?.granularity ?? "hour");
  const [boundaryExpanded, setBoundaryExpanded] = useState(false);
  const [startDate, setStartDate] = useState(saved?.startDate ?? today);
  const [endDate, setEndDate] = useState(saved?.endDate ?? today);
  const [activeChart, setActiveChart] = useState<MainChartId | null>(saved?.activeChart ?? null);
  const [expandedChart, setExpandedChart] = useState<MainChartId | null>(saved?.expandedChart ?? null);
  const [zoomWindow, setZoomWindow] = useState<{ start: number; end: number }>(saved?.zoomWindow ?? { start: 0, end: 100 });

  // 每图独立配置（粒度可被全局或单独控制）
  const [priceCfg, setPriceCfg] = useState<ChartCfg>(initialCfg(globalGranularity));
  const [loadCfg, setLoadCfg] = useState<ChartCfg>(initialCfg(globalGranularity));
  const [renCfg, setRenCfg] = useState<ChartCfg>(initialCfg(globalGranularity));
  const [spaceCfg, setSpaceCfg] = useState<ChartCfg>(initialCfg(globalGranularity));

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
    const end = new Date(`${today}T00:00:00`);
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

  const handleZoomWheel = (deltaY: number) => {
    setZoomWindow((current) => {
      const width = current.end - current.start;
      const nextWidth = Math.max(18, Math.min(100, width + (deltaY > 0 ? 10 : -10)));
      const center = (current.start + current.end) / 2;
      const start = Math.max(0, Math.min(100 - nextWidth, center - nextWidth / 2));
      const next = { start: Math.round(start), end: Math.round(start + nextWidth) };
      applyZoomDrivenGranularity(next);
      return next;
    });
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
      priceSeries, loadSeries, renSeries, spaceSeries, zoomWindow,
      activeChart, expandedChart,
    }));
  }, [province, startDate, endDate, globalGranularity, priceSeries, loadSeries, renSeries, spaceSeries, zoomWindow, activeChart, expandedChart]);

  // 各图数据
  const priceForecast = useMemo(() => getForecastSeries("price", startDate, endDate, priceCfg.granularity), [startDate, endDate, priceCfg.granularity]);
  const loadForecast = useMemo(() => getForecastSeries("load", startDate, endDate, loadCfg.granularity), [startDate, endDate, loadCfg.granularity]);
  const renForecast = useMemo(() => getForecastSeries("renewable", startDate, endDate, renCfg.granularity), [startDate, endDate, renCfg.granularity]);
  const spaceForecast = useMemo(() => getForecastSeries("space", startDate, endDate, spaceCfg.granularity), [startDate, endDate, spaceCfg.granularity]);
  const priceDs = useMemo(() => ({ price: priceForecast.map((p) => ({ ...p, dayAhead: p.predicted, realtime: p.actual, spread: p.deviation, cleared: Math.max(400, Math.round(p.predicted * 2.2)) })), xKey: priceCfg.granularity === "day" ? "dayLabel" as const : "label" as const, xInterval: priceCfg.granularity === "15min" ? 15 : priceCfg.granularity === "hour" ? 5 : 0, periodLabel: (p: any) => p.date ? `${p.date} · 时段 ${p.periodRange}` : "" }), [priceForecast, priceCfg.granularity]);
  const loadDs = useMemo(() => ({ load: loadForecast, xKey: loadCfg.granularity === "day" ? "dayLabel" as const : "label" as const, xInterval: loadCfg.granularity === "15min" ? 15 : loadCfg.granularity === "hour" ? 5 : 0, periodLabel: (p: any) => p.date ? `${p.date} · 时段 ${p.periodRange}` : "" }), [loadForecast, loadCfg.granularity]);
  const renDs = useMemo(() => ({ renewable: renForecast, xKey: renCfg.granularity === "day" ? "dayLabel" as const : "label" as const, xInterval: renCfg.granularity === "15min" ? 15 : renCfg.granularity === "hour" ? 5 : 0, periodLabel: (p: any) => p.date ? `${p.date} · 时段 ${p.periodRange}` : "" }), [renForecast, renCfg.granularity]);
  const spaceDs = useMemo(() => ({ space: spaceForecast.map((p) => ({ ...p, warning: p.predicted < SPACE_WARN_THRESHOLD })), xKey: spaceCfg.granularity === "day" ? "dayLabel" as const : "label" as const, xInterval: spaceCfg.granularity === "15min" ? 15 : spaceCfg.granularity === "hour" ? 5 : 0, periodLabel: (p: any) => p.date ? `${p.date} · 时段 ${p.periodRange}` : "" }), [spaceForecast, spaceCfg.granularity]);
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
    { label: "负荷预测均值", stat: summarizeForecast(loadForecast), unit: "MW" },
    { label: "新能源预测均值", stat: summarizeForecast(renForecast), unit: "MW" },
    { label: "竞价空间预测", stat: summarizeForecast(spaceForecast), unit: "MW" },
    { label: "电价预测均值", stat: summarizeForecast(priceForecast), unit: "元/MWh" },
  ], [loadForecast, renForecast, spaceForecast, priceForecast]);

  return (
    <MarketCursorProvider>
      <div className="px-6 py-5 space-y-4 min-h-[calc(100vh-5rem)]">
        <header className="rounded-lg border bg-card p-4 shadow-notion">
          <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap">
            <h1 className="text-lg font-semibold shrink-0">市场看板</h1>
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
        </header>

        <section className="rounded-lg border bg-card p-4 shadow-notion">
          <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap">
            <h2 className="text-sm font-semibold shrink-0">行情摘要</h2>
            {forecastSummary.map((card) => (
              <div key={card.label} className="min-w-[128px] rounded-md border bg-background px-3 py-2 shrink-0">
                <p className="text-[10px] text-muted-foreground truncate">{card.label}</p>
                <p className="text-sm font-semibold leading-tight mt-1">
                  {card.stat.avgPredicted.toLocaleString()}
                  <span className="text-[10px] font-normal text-muted-foreground ml-1">{card.unit}</span>
                </p>
                <p className={`text-[10px] mt-1 flex items-center gap-0.5 ${card.stat.avgDeviation >= 0 ? "text-destructive" : "text-success"}`}>
                  {card.stat.avgDeviation >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  偏差 {card.stat.avgDeviation >= 0 ? "+" : ""}{card.stat.avgDeviation} · {card.stat.avgAbsPct}%
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-notion">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold">规则预警</h2>
          </div>
          <div className="grid gap-2 xl:grid-cols-2">
            {ruleWarnings.map((w) => (
              <div
                key={w.id}
                className={`p-3 rounded-md text-xs border ${
                  w.level === "high"
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-warning/30 bg-warning/5"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle
                    className={`h-3 w-3 shrink-0 ${w.level === "high" ? "text-destructive" : "text-warning"}`}
                  />
                  <p className="font-medium text-foreground flex-1 text-[11px]">{w.title}</p>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground shrink-0">规则计算</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">公开API</span>
                </div>
                <div className="pl-4 space-y-0.5 text-[10px] text-muted-foreground">
                  <p><span className="text-foreground/70">时段：</span>{w.period}</p>
                  <p><span className="text-foreground/70">当前值：</span>{w.current}</p>
                  <p className="text-foreground/80"><span className="text-foreground/60">建议：</span>{w.action}</p>
                </div>
              </div>
            ))}
          </div>
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
          onExpand={() => { setActiveChart("price-spread"); setExpandedChart("price-spread"); }}
          onExpandedChange={(open) => setExpandedChart(open ? "price-spread" : null)}
          onZoomWheel={handleZoomWheel}
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
              <p className="text-[11px] text-muted-foreground mt-1">保留主图之外，补充预测电价、预测偏差与候选影响因子。</p>
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
          onExpand={() => { setActiveChart("load-forecast"); setExpandedChart("load-forecast"); }}
          onExpandedChange={(open) => setExpandedChart(open ? "load-forecast" : null)}
          onZoomWheel={handleZoomWheel}
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
          onExpand={() => { setActiveChart("renewable-output"); setExpandedChart("renewable-output"); }}
          onExpandedChange={(open) => setExpandedChart(open ? "renewable-output" : null)}
          onZoomWheel={handleZoomWheel}
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
          onExpand={() => { setActiveChart("bidding-space"); setExpandedChart("bidding-space"); }}
          onExpandedChange={(open) => setExpandedChart(open ? "bidding-space" : null)}
          onZoomWheel={handleZoomWheel}
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
              <span className="text-[11px] text-muted-foreground">联络线 / 断面 / 必开必停 / 备用</span>
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
            {boundaryRows.map((row) => (
              <div key={row.item} className="p-2.5 rounded-md border bg-background">
                <p className="text-[11px] text-muted-foreground mb-0.5">{row.item}</p>
                <p className="text-sm font-semibold">{row.value}</p>
                <p className="text-[10px] text-muted-foreground">{row.note}</p>
                {row.trendKey && (
                  <BoundaryMiniChart
                    data={boundaryDs.boundary as any[]}
                    dataKey={row.trendKey}
                    color={row.trendKey === "sectionLoad" ? "hsl(var(--warning))" : C_PRIMARY}
                  />
                )}
              </div>
            ))}
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
    action: "建议关注晚间申报策略",
    level: "high",
  },
  {
    id: "rw-2",
    title: "断面接近限额",
    period: "皖南-皖北断面",
    current: "当前负载 78%",
    threshold: "接近预警阈值 80%",
    action: "建议关注晚高峰送电安排",
    level: "medium",
  },
  {
    id: "rw-3",
    title: "备用偏紧",
    period: "19:30-21:00",
    current: "正备用 1,820 MW",
    threshold: "低于预设阈值 2,000 MW",
    action: "建议预留响应空间",
    level: "medium",
  },
  {
    id: "rw-4",
    title: "必开机组状态提醒",
    period: "全日",
    current: "必开 6 台 / 必停 2 台",
    threshold: "较 D-1 新增必开 1 台",
    action: "建议复核中长期匹配",
    level: "medium",
  },
];

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

function SourceBadge({ label }: { label: DataSourceTag }) {
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{label}</span>;
}
