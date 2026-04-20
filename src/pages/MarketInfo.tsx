import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  MapPin,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ===== 96 点 15 分钟基础数据生成 =====
type Granularity = "15min" | "hour";

// 时段编号 1-96，对应时间 HH:MM
function pointLabel(idx: number) {
  const totalMin = idx * 15;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// 用确定性伪随机替代 Math.random，避免每次 setState 重渲染数据抖动
function seeded(seed: number) {
  return Math.sin(seed * 9301 + 49297) * 0.5 + 0.5; // 0..1
}

interface PricePoint {
  idx: number;
  label: string;
  period: string; // 时段号
  dayAhead: number;
  realtime: number;
  spread: number;
}
interface LoadPoint {
  idx: number;
  label: string;
  period: string;
  predicted: number;
  actual: number;
  deviation: number;
  deviationPct: string;
}
interface RenewablePoint {
  idx: number;
  label: string;
  period: string;
  solar: number;
  wind: number;
  total: number;
}
interface SpacePoint {
  idx: number;
  label: string;
  period: string;
  load: number;
  renewable: number;
  space: number;
}

const points96 = Array.from({ length: 96 }, (_, i) => i);

const price96: PricePoint[] = points96.map((i) => {
  const t = i / 96;
  const base = 280 + Math.sin(t * Math.PI * 2) * 90 + Math.cos(i / 12) * 30;
  const dayAhead = Math.round(base + 50);
  const realtime = Math.round(base + 50 + (seeded(i) - 0.5) * 60);
  return {
    idx: i,
    label: pointLabel(i),
    period: String(i + 1),
    dayAhead,
    realtime,
    spread: realtime - dayAhead,
  };
});

const load96: LoadPoint[] = points96.map((i) => {
  const t = (i - 24) / 96; // 偏移让早晨开始上升
  const base = 3000 + Math.sin(t * Math.PI * 2) * 1200 + 800;
  const predicted = Math.round(base);
  const actual = Math.round(base + (seeded(i + 100) - 0.5) * 200);
  const deviation = actual - predicted;
  return {
    idx: i,
    label: pointLabel(i),
    period: String(i + 1),
    predicted,
    actual,
    deviation,
    deviationPct: ((deviation / predicted) * 100).toFixed(1),
  };
});

const renewable96: RenewablePoint[] = points96.map((i) => {
  // 光伏：6:00-18:00 抛物线
  const hour = i / 4;
  const sun = hour >= 6 && hour <= 18 ? Math.sin(((hour - 6) / 12) * Math.PI) * 1100 : 0;
  const wind = 400 + Math.cos(i / 16) * 250 + seeded(i + 200) * 80;
  const solar = Math.max(0, Math.round(sun));
  const windOut = Math.round(wind);
  return {
    idx: i,
    label: pointLabel(i),
    period: String(i + 1),
    solar,
    wind: windOut,
    total: solar + windOut,
  };
});

const space96: SpacePoint[] = points96.map((i) => ({
  idx: i,
  label: pointLabel(i),
  period: String(i + 1),
  load: load96[i].predicted,
  renewable: renewable96[i].total,
  space: load96[i].predicted - renewable96[i].total,
}));

// ===== 聚合到小时（96 → 24，每 4 点取均值）=====
function aggregateToHour<T extends { idx: number }>(
  arr: T[],
  numericKeys: (keyof T)[],
): (T & { hourLabel: string; periodRange: string })[] {
  const out: any[] = [];
  for (let h = 0; h < 24; h++) {
    const slice = arr.slice(h * 4, h * 4 + 4);
    const merged: any = { ...slice[0] };
    numericKeys.forEach((k) => {
      merged[k] = Math.round(slice.reduce((s, p) => s + (p[k] as number), 0) / slice.length);
    });
    merged.hourLabel = `${String(h).padStart(2, "0")}:00`;
    merged.periodRange = `${h * 4 + 1}-${h * 4 + 4}`;
    out.push(merged);
  }
  return out;
}

// ===== 静态信息 =====
const boundaryRows = [
  { item: "联络线外送计划", value: "+850 MW", note: "向华东送电" },
  { item: "皖南-皖北断面限额", value: "2,400 MW", note: "当前负载 78%" },
  { item: "必开机组容量", value: "1,200 MW", note: "3 台火电" },
  { item: "必停机组容量", value: "320 MW", note: "1 台检修" },
  { item: "非市场化机组出力", value: "640 MW", note: "核电基荷" },
  { item: "正备用 / 负备用", value: "520 / 380 MW", note: "正常区间" },
];

const announcements = [
  { title: "关于 2025 年 7 月第三周现货交易出清结果的公告", date: "07-15 10:30", source: "交易中心" },
  { title: "安徽省 2025 年 8 月月度集中竞价交易公告", date: "07-14 16:00", source: "交易中心" },
  { title: "关于调整 2025 年下半年中长期交易时间的通知", date: "07-12 11:00", source: "省能源局" },
];

const alerts = [
  { level: "high", text: "18:00-20:00 实时价差扩大至 +47 元/MWh，建议关注晚高峰申报" },
  { level: "medium", text: "新能源预测偏差较高（-12%），光伏实际出力低于预测" },
  { level: "medium", text: "皖南-皖北关键断面接近限额（78%），后续可能压减外送" },
];

const dayAheadAvg = Math.round(price96.reduce((s, p) => s + p.dayAhead, 0) / 96);
const realtimeAvg = Math.round(price96.reduce((s, p) => s + p.realtime, 0) / 96);
const summary = [
  { label: "日前均价", value: dayAheadAvg, unit: "元/MWh", change: "+3.2%", up: true },
  { label: "实时均价", value: realtimeAvg, unit: "元/MWh", change: "-1.1%", up: false },
  { label: "日前-实时价差", value: realtimeAvg - dayAheadAvg, unit: "元/MWh", change: "扩大", up: true },
  { label: "最大负荷", value: Math.max(...load96.map((l) => l.actual)).toLocaleString(), unit: "MW", change: "+5.8%", up: true },
  { label: "新能源预测(峰)", value: Math.max(...renewable96.map((r) => r.total)).toLocaleString(), unit: "MW", change: "+2.1%", up: true },
  { label: "竞价空间(峰)", value: Math.max(...space96.map((b) => b.space)).toLocaleString(), unit: "MW", change: "—", up: true },
  { label: "正备用", value: 520, unit: "MW", change: "正常", up: true },
  { label: "负备用", value: 380, unit: "MW", change: "正常", up: true },
];

// chart colors via design tokens
const C_PRIMARY = "hsl(var(--primary))";
const C_MUTED = "hsl(var(--muted-foreground))";
const C_DESTRUCTIVE = "hsl(var(--destructive))";
const C_SUCCESS = "hsl(var(--success))";

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg shadow-notion bg-card p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

export default function MarketInfo() {
  const [granularity, setGranularity] = useState<Granularity>("hour");

  const { priceData, loadData, renewableData, spaceData, xKey, xInterval, periodLabel } =
    useMemo(() => {
      if (granularity === "15min") {
        return {
          priceData: price96,
          loadData: load96,
          renewableData: renewable96,
          spaceData: space96,
          xKey: "label",
          // 96 点：每 8 个点(2 小时)显示一个刻度
          xInterval: 7,
          periodLabel: (p: any) => `时段 ${p.period}`,
        };
      }
      const priceData = aggregateToHour(price96, ["dayAhead", "realtime", "spread"]);
      const loadData = aggregateToHour(load96, ["predicted", "actual", "deviation"]);
      const renewableData = aggregateToHour(renewable96, ["solar", "wind", "total"]);
      const spaceData = aggregateToHour(space96, ["load", "renewable", "space"]);
      return {
        priceData,
        loadData,
        renewableData,
        spaceData,
        xKey: "hourLabel",
        xInterval: 2,
        periodLabel: (p: any) => `时段 ${p.periodRange}`,
      };
    }, [granularity]);

  const tooltipFormatter = (unit: string) =>
    (v: number, name: string, p: any) => {
      const tag = p?.payload ? periodLabel(p.payload) : "";
      return [`${v.toLocaleString()} ${unit}`, `${name}${tag ? ` · ${tag}` : ""}`];
    };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">市场看板</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Select defaultValue="anhui">
            <SelectTrigger className="h-8 w-24 text-xs"><MapPin className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="anhui">安徽</SelectItem>
              <SelectItem value="shandong">山东</SelectItem>
              <SelectItem value="guangdong">广东</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="2025-07-15">
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-07-15">2025-07-15</SelectItem>
              <SelectItem value="2025-07-14">2025-07-14</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">交易日 D</span>
          <div className="flex rounded-md border overflow-hidden text-xs">
            <button
              onClick={() => setGranularity("15min")}
              className={`px-2 py-1 ${granularity === "15min" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              15分钟 · 96点
            </button>
            <button
              onClick={() => setGranularity("hour")}
              className={`px-2 py-1 ${granularity === "hour" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              1小时 · 24点
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> 更新 10:32
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]">
            公开披露
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summary.map((card) => (
          <div key={card.label} className="p-3 rounded-lg shadow-notion bg-card">
            <p className="text-[11px] text-muted-foreground mb-1">{card.label}</p>
            <p className="text-lg font-semibold leading-tight">
              {card.value}
              <span className="text-[10px] font-normal text-muted-foreground ml-1">{card.unit}</span>
            </p>
            <p className={`text-[10px] mt-0.5 flex items-center gap-0.5 ${card.up ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
              {card.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {card.change}
            </p>
          </div>
        ))}
      </div>

      {/* 1. 电价与价差 */}
      <Section title="1. 电价与价差" subtitle={`日前 vs 实时 vs 价差（元/MWh）· ${granularity === "15min" ? "96 点" : "24 点"}`}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10 }} interval={xInterval} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={tooltipFormatter("元/MWh")} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="right" dataKey="spread" name="价差" fill={C_PRIMARY} fillOpacity={0.25} />
              <Line yAxisId="left" type="monotone" dataKey="dayAhead" name="日前电价" stroke={C_PRIMARY} strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="realtime" name="实时电价" stroke={C_DESTRUCTIVE} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          价差 = 实时电价 − 日前电价。{granularity === "15min" ? "15 分钟粒度，时段编号 1-96。" : "1 小时聚合（每 4 个 15 分钟时段取均值）。"}
        </p>
      </Section>

      {/* 2. 负荷预测 vs 实际 */}
      <Section title="2. 负荷预测 vs 实际" subtitle="单位 MW · 偏差以折线展示">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={loadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10 }} interval={xInterval} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={tooltipFormatter("MW")} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="predicted" name="预测负荷" fill={C_PRIMARY} fillOpacity={0.35} />
              <Bar yAxisId="left" dataKey="actual" name="实际负荷" fill={C_PRIMARY} />
              <Line yAxisId="right" type="monotone" dataKey="deviation" name="偏差(MW)" stroke={C_DESTRUCTIVE} strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* 3. 新能源出力 */}
      <Section title="3. 新能源出力" subtitle="风电 + 光伏 预测出力（MW）">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={renewableData}>
              <defs>
                <linearGradient id="solar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C_PRIMARY} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={C_PRIMARY} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="wind" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C_SUCCESS} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={C_SUCCESS} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10 }} interval={xInterval} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={tooltipFormatter("MW")} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="wind" name="风电" stackId="1" stroke={C_SUCCESS} fill="url(#wind)" />
              <Area type="monotone" dataKey="solar" name="光伏" stackId="1" stroke={C_PRIMARY} fill="url(#solar)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          全天新能源占比约 32.7%，11:00-14:00 光伏富集时段占比最高。
        </p>
      </Section>

      {/* 4. 竞价空间 */}
      <Section title="4. 竞价空间" subtitle="竞价空间 = 总负荷预测 − 新能源预测">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={spaceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10 }} interval={xInterval} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={tooltipFormatter("MW")} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="load" name="总负荷预测" stroke={C_MUTED} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="renewable" name="新能源预测" stroke={C_SUCCESS} strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="space" name="竞价空间" stroke={C_PRIMARY} fill={C_PRIMARY} fillOpacity={0.2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          ⚠️ 竞价空间低于 800 MW 时进入预警区间，对应时段：12:00-14:00。
        </p>
      </Section>

      {/* 5. 市场运行与边界 */}
      <Section title="5. 市场运行与边界" subtitle="联络线 / 断面 / 必开必停 / 备用">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {boundaryRows.map((row) => (
            <div key={row.item} className="p-3 rounded-md border bg-background">
              <p className="text-[11px] text-muted-foreground mb-0.5">{row.item}</p>
              <p className="text-sm font-semibold">{row.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{row.note}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. 公告与异常 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section title="6. 最新公告">
          <div className="space-y-1">
            {announcements.map((a, i) => (
              <div key={i} className="flex items-start justify-between py-2 border-b last:border-b-0 gap-3">
                <span className="text-sm flex-1 leading-snug">{a.title}</span>
                <div className="flex flex-col items-end text-[10px] text-muted-foreground shrink-0">
                  <span>{a.source}</span>
                  <span>{a.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="异常提示">
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 p-2.5 rounded-md text-xs ${
                  a.level === "high"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-warning/10 text-warning-foreground"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="leading-snug">{a.text}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
