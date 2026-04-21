import { useMemo, useState } from "react";
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
  summary,
  boundaryRows,
  marketEvents,
  SPACE_WARN_THRESHOLD,
  load96,
  renewable96,
} from "@/lib/marketMocks";
import { MarketCursorProvider } from "@/contexts/MarketCursorContext";
import { useProvince, type ProvinceCode } from "@/contexts/ProvinceContext";

import { ChartCard } from "@/components/market/ChartCard";
import { WorkbenchLayout, WorkbenchPanel } from "@/components/layout/WorkbenchLayout";
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
import type { RangeKey } from "@/components/market/ChartToolbar";

interface ChartCfg {
  granularity: Granularity;
  range: RangeKey;
  showLegend: boolean;
}

const initialCfg = (g: Granularity): ChartCfg => ({ granularity: g, range: "1d", showLegend: true });

export default function MarketInfo() {
  const { province, setProvince } = useProvince();
  const [globalGranularity, setGlobalGranularity] = useState<Granularity>("hour");
  const [boundaryExpanded, setBoundaryExpanded] = useState(false);

  // 每图独立配置（粒度可被全局或单独控制）
  const [priceCfg, setPriceCfg] = useState<ChartCfg>(initialCfg(globalGranularity));
  const [loadCfg, setLoadCfg] = useState<ChartCfg>(initialCfg(globalGranularity));
  const [renCfg, setRenCfg] = useState<ChartCfg>(initialCfg(globalGranularity));
  const [spaceCfg, setSpaceCfg] = useState<ChartCfg>(initialCfg(globalGranularity));

  // 系列可见性
  const [priceSeries, setPriceSeries] = useState({ dayAhead: true, realtime: true, spread: true, cleared: true });
  const [renSeries, setRenSeries] = useState({ wind: true, solar: true, total: true });

  const setGlobalAll = (g: Granularity) => {
    setGlobalGranularity(g);
    setPriceCfg((c) => ({ ...c, granularity: g }));
    setLoadCfg((c) => ({ ...c, granularity: g }));
    setRenCfg((c) => ({ ...c, granularity: g }));
    setSpaceCfg((c) => ({ ...c, granularity: g }));
  };

  // 各图数据
  const priceDs = useMemo(() => getDataset(priceCfg.granularity), [priceCfg.granularity]);
  const loadDs = useMemo(() => getDataset(loadCfg.granularity), [loadCfg.granularity]);
  const renDs = useMemo(() => getDataset(renCfg.granularity), [renCfg.granularity]);
  const spaceDs = useMemo(() => getDataset(spaceCfg.granularity), [spaceCfg.granularity]);
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

  return (
    <MarketCursorProvider>
      <WorkbenchLayout
        middle={
          <>
            <h1 className="text-lg font-semibold">市场看板</h1>

            {/* 筛选 */}
            <WorkbenchPanel title="筛选">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">省份</span>
                  <Select value={province} onValueChange={(v) => setProvince(v as ProvinceCode)}>
                    <SelectTrigger className="h-8 w-32 text-xs"><MapPin className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anhui">安徽</SelectItem>
                      <SelectItem value="shandong">山东</SelectItem>
                      <SelectItem value="guangdong">广东</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">日期</span>
                  <Select defaultValue="2025-07-15">
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025-07-15">2025-07-15</SelectItem>
                      <SelectItem value="2025-07-14">2025-07-14</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">交易日</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">D</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">粒度</span>
                  <div className="flex rounded-md border overflow-hidden text-xs">
                    <button
                      onClick={() => setGlobalAll("15min")}
                      className={`px-2 py-1 ${globalGranularity === "15min" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                    >15分</button>
                    <button
                      onClick={() => setGlobalAll("hour")}
                      className={`px-2 py-1 ${globalGranularity === "hour" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                    >1小时</button>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> 更新 10:32
                </span>
                <span className="px-1.5 py-0.5 rounded bg-success/10 text-success">公开披露</span>
              </div>
            </WorkbenchPanel>

            {/* 行情摘要卡片 */}
            <WorkbenchPanel title="行情摘要">
              <div className="grid grid-cols-2 gap-2">
                {summary.map((card) => (
                  <div key={card.label} className="p-2 rounded-md border bg-background">
                    <p className="text-[10px] text-muted-foreground mb-0.5 truncate">{card.label}</p>
                    <p className="text-sm font-semibold leading-tight">
                      {card.value}
                      <span className="text-[10px] font-normal text-muted-foreground ml-1">{card.unit}</span>
                    </p>
                    <p className={`text-[10px] mt-0.5 flex items-center gap-0.5 ${card.up ? "text-success" : "text-destructive"}`}>
                      {card.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {card.change}
                    </p>
                  </div>
                ))}
              </div>
            </WorkbenchPanel>

            {/* 公告信息 */}
            <WorkbenchPanel title="公告信息">
              <div className="space-y-1 max-h-64 overflow-auto">
                {marketEvents.filter((e) => e.category === "公告" || e.category === "规则").map((a) => (
                  <div key={a.id} className="py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[11px] font-medium leading-snug truncate flex-1">{a.title}</p>
                      <span className="shrink-0 text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary">
                        原生公告
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{a.detail}</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5 font-mono">{a.time} · {a.source}</p>
                  </div>
                ))}
              </div>
            </WorkbenchPanel>

            {/* 规则预警 */}
            <WorkbenchPanel title="规则预警">
              <div className="space-y-2">
                {ruleWarnings.map((w) => (
                  <div
                    key={w.id}
                    className={`p-2 rounded-md text-xs border ${
                      w.level === "high"
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-warning/30 bg-warning/5"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle
                        className={`h-3 w-3 shrink-0 ${
                          w.level === "high" ? "text-destructive" : "text-warning"
                        }`}
                      />
                      <p className="font-medium text-foreground flex-1 text-[11px]">{w.title}</p>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                        规则计算
                      </span>
                    </div>
                    <div className="pl-4 space-y-0.5 text-[10px] text-muted-foreground">
                      <p><span className="text-foreground/70">时段：</span>{w.period}</p>
                      <p><span className="text-foreground/70">当前值：</span>{w.current}</p>
                      <p className="text-foreground/80"><span className="text-foreground/60">建议：</span>{w.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </WorkbenchPanel>
          </>
        }
      >
        {/* 右栏：主图表区 */}

        {/* 1. 电价与价差 */}
        <ChartCard
          index={1}
          chartId="price-spread"
          title="电价与价差"
          caption="日前 vs 实时 vs 价差 + 出清电量"
          granularity={priceCfg.granularity}
          onGranularityChange={(g) => setPriceCfg({ ...priceCfg, granularity: g })}
          range={priceCfg.range}
          onRangeChange={(r) => setPriceCfg({ ...priceCfg, range: r })}
          showLegend={priceCfg.showLegend}
          onToggleLegend={() => setPriceCfg({ ...priceCfg, showLegend: !priceCfg.showLegend })}
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
              <span className="text-muted-foreground ml-auto">价差 = 实时 − 日前</span>
            </div>
          }
        >
          <PriceSpreadChart
            data={priceDs.price}
            xKey={priceDs.xKey}
            xInterval={priceDs.xInterval}
            periodLabel={priceDs.periodLabel}
            showLegend={priceCfg.showLegend}
            visibleSeries={priceSeries}
          />
        </ChartCard>

        {/* 2. 负荷预测 vs 实际 */}
        <ChartCard
          index={2}
          chartId="load-forecast"
          title="负荷预测 vs 实际"
          caption="预测/实际同图对比 + 偏差曲线"
          granularity={loadCfg.granularity}
          onGranularityChange={(g) => setLoadCfg({ ...loadCfg, granularity: g })}
          range={loadCfg.range}
          onRangeChange={(r) => setLoadCfg({ ...loadCfg, range: r })}
          showLegend={loadCfg.showLegend}
          onToggleLegend={() => setLoadCfg({ ...loadCfg, showLegend: !loadCfg.showLegend })}
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
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <Stat label="最大正偏差" value={`+${loadStats.maxPos} MW`} tone="destructive" />
              <Stat label="最大负偏差" value={`${loadStats.maxNeg} MW`} tone="success" />
              <Stat label="平均偏差" value={`${loadStats.avg > 0 ? "+" : ""}${loadStats.avg} MW`} />
              <Stat label="平均偏差率" value={`${loadStats.avgPct}%`} />
            </div>
          }
        >
          <LoadForecastChart
            data={loadDs.load}
            xKey={loadDs.xKey}
            xInterval={loadDs.xInterval}
            periodLabel={loadDs.periodLabel}
            showLegend={loadCfg.showLegend}
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
          onRangeChange={(r) => setRenCfg({ ...renCfg, range: r })}
          showLegend={renCfg.showLegend}
          onToggleLegend={() => setRenCfg({ ...renCfg, showLegend: !renCfg.showLegend })}
          tableHeader={["时段", "风电(MW)", "光伏(MW)", "总出力(MW)"]}
          tableRows={renDs.renewable.map((p: any) => [p.label ?? p.hourLabel, p.wind, p.solar, p.total])}
          csvFilename="renewable.csv"
          csvRows={[
            ["时段", "风电", "光伏", "总出力"],
            ...renDs.renewable.map((p: any) => [p.label ?? p.hourLabel, p.wind, p.solar, p.total]),
          ]}
          footer={
            <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px]">
              {[
                { k: "wind", label: "风电", color: C_SUCCESS },
                { k: "solar", label: "光伏", color: C_PRIMARY },
                { k: "total", label: "总出力", color: "hsl(var(--destructive))" },
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
            </div>
          }
        >
          <RenewableChart
            data={renDs.renewable}
            xKey={renDs.xKey}
            xInterval={renDs.xInterval}
            periodLabel={renDs.periodLabel}
            showLegend={renCfg.showLegend}
            visibleSeries={renSeries}
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
          onRangeChange={(r) => setSpaceCfg({ ...spaceCfg, range: r })}
          showLegend={spaceCfg.showLegend}
          onToggleLegend={() => setSpaceCfg({ ...spaceCfg, showLegend: !spaceCfg.showLegend })}
          tableHeader={["时段", "总负荷(MW)", "新能源(MW)", "竞价空间", "状态"]}
          tableRows={spaceDs.space.map((p: any) => [
            p.label ?? p.hourLabel, p.load, p.renewable, p.space, p.warning ? "⚠️ 预警" : "正常",
          ])}
          csvFilename="bidding-space.csv"
          csvRows={[
            ["时段", "总负荷", "新能源", "竞价空间", "预警"],
            ...spaceDs.space.map((p: any) => [p.label ?? p.hourLabel, p.load, p.renewable, p.space, p.warning ? 1 : 0]),
          ]}
        >
          <BiddingSpaceChart
            data={spaceDs.space}
            xKey={spaceDs.xKey}
            xInterval={spaceDs.xInterval}
            periodLabel={spaceDs.periodLabel}
            showLegend={spaceCfg.showLegend}
            threshold={SPACE_WARN_THRESHOLD}
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

        {/* 公告信息 / 规则预警 已移到中栏控制区 */}
      </WorkbenchLayout>
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
