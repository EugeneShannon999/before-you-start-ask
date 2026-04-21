// 市场看板 mock 数据：96 点(15 分钟) + 小时聚合
export type Granularity = "15min" | "hour";

export function pointLabel(idx: number) {
  const totalMin = idx * 15;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function seeded(seed: number) {
  return Math.sin(seed * 9301 + 49297) * 0.5 + 0.5;
}

export interface PricePoint {
  idx: number;
  label: string;
  period: string;
  dayAhead: number;
  realtime: number;
  spread: number;
  cleared: number; // 出清电量 MWh
}
export interface LoadPoint {
  idx: number;
  label: string;
  period: string;
  predicted: number;
  actual: number;
  deviation: number;
  deviationPct: string;
}
export interface RenewablePoint {
  idx: number;
  label: string;
  period: string;
  solar: number;
  wind: number;
  total: number;
}
export interface SpacePoint {
  idx: number;
  label: string;
  period: string;
  load: number;
  renewable: number;
  space: number;
  warning: boolean;
}
export interface BoundaryPoint {
  idx: number;
  label: string;
  period: string;
  tieLine: number; // 联络线 MW
  sectionLoad: number; // 断面负载率 %
  reservePos: number;
  reserveNeg: number;
}

const points96 = Array.from({ length: 96 }, (_, i) => i);

export const SPACE_WARN_THRESHOLD = 800; // 竞价空间预警阈值 MW

export const price96: PricePoint[] = points96.map((i) => {
  const t = i / 96;
  const base = 280 + Math.sin(t * Math.PI * 2) * 90 + Math.cos(i / 12) * 30;
  const dayAhead = Math.round(base + 50);
  const realtime = Math.round(base + 50 + (seeded(i) - 0.5) * 60);
  // 出清电量：日内随负荷波动，500-1500 MWh
  const cleared = Math.round(900 + Math.sin((t - 0.25) * Math.PI * 2) * 400 + seeded(i + 50) * 100);
  return {
    idx: i,
    label: pointLabel(i),
    period: String(i + 1),
    dayAhead,
    realtime,
    spread: realtime - dayAhead,
    cleared,
  };
});

export const load96: LoadPoint[] = points96.map((i) => {
  const t = (i - 24) / 96;
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

export const renewable96: RenewablePoint[] = points96.map((i) => {
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

export const space96: SpacePoint[] = points96.map((i) => {
  const space = load96[i].predicted - renewable96[i].total;
  return {
    idx: i,
    label: pointLabel(i),
    period: String(i + 1),
    load: load96[i].predicted,
    renewable: renewable96[i].total,
    space,
    warning: space < SPACE_WARN_THRESHOLD,
  };
});

export const boundary96: BoundaryPoint[] = points96.map((i) => {
  const t = i / 96;
  return {
    idx: i,
    label: pointLabel(i),
    period: String(i + 1),
    tieLine: Math.round(800 + Math.sin(t * Math.PI * 2) * 120 + seeded(i + 300) * 40),
    sectionLoad: Math.round(60 + Math.sin((t - 0.3) * Math.PI * 2) * 18 + seeded(i + 400) * 5),
    reservePos: Math.round(520 + (seeded(i + 500) - 0.5) * 40),
    reserveNeg: Math.round(380 + (seeded(i + 600) - 0.5) * 30),
  };
});

// 聚合到小时
export function aggregateToHour<T extends { idx: number }>(
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

export function getDataset(granularity: Granularity) {
  if (granularity === "15min") {
    return {
      price: price96,
      load: load96,
      renewable: renewable96,
      space: space96,
      boundary: boundary96,
      xKey: "label" as const,
      xInterval: 7,
      periodLabel: (p: any) => `时段 ${p.period}`,
    };
  }
  return {
    price: aggregateToHour(price96, ["dayAhead", "realtime", "spread", "cleared"]),
    load: aggregateToHour(load96, ["predicted", "actual", "deviation"]),
    renewable: aggregateToHour(renewable96, ["solar", "wind", "total"]),
    space: aggregateToHour(space96, ["load", "renewable", "space"]).map((s: any) => ({
      ...s,
      warning: s.space < SPACE_WARN_THRESHOLD,
    })),
    boundary: aggregateToHour(boundary96, ["tieLine", "sectionLoad", "reservePos", "reserveNeg"]),
    xKey: "hourLabel" as const,
    xInterval: 2,
    periodLabel: (p: any) => `时段 ${p.periodRange}`,
  };
}

// ============================================================
// 价差影响因子对照（SP1）
// 字段口径：
//   spread     = 日前电价 - 实时电价
//   loadDev    = 实际负荷 - 日前负荷预测
//   tieLineDev = 实际联络线总量 - 日前联络线计划总量
// 候选主因仅做候选判断，不做因果定论：
//   "load" 负荷偏差主导 / "tieLine" 联络线偏差主导
//   "mixed" 多因子叠加 / "none" 暂无明显主导因子
// 风电 / 光伏差列 SP1 不展示（无同口径实际值）
// ============================================================
export type SpreadDriver = "load" | "tieLine" | "mixed" | "none";
export interface SpreadFactorRow {
  hour: number;
  hourLabel: string;
  periodRange: string;
  spread: number;       // 元/MWh
  loadDev: number;      // MW
  tieLineDev: number;   // MW
  driver: SpreadDriver;
}

// 联络线"计划"基线：在 boundary96.tieLine（视作实际）基础上做平稳化处理
const tieLinePlan96 = boundary96.map((p, i) => {
  // 用滑动平均近似日前计划，并叠加少量偏置
  const w = [boundary96[(i - 2 + 96) % 96].tieLine, boundary96[(i - 1 + 96) % 96].tieLine, p.tieLine];
  return Math.round(w.reduce((s, v) => s + v, 0) / w.length + (seeded(i + 700) - 0.5) * 30);
});

function classifyDriver(spread: number, loadDev: number, tieLineDev: number): SpreadDriver {
  // SP1 简单候选判断：相对幅度比较 + 阈值
  const aSpread = Math.abs(spread);
  if (aSpread < 8) return "none";
  const aLoad = Math.abs(loadDev);
  const aTie = Math.abs(tieLineDev);
  if (aLoad < 80 && aTie < 60) return "none";
  // 主导项：远大于另一项（>=1.8x）且本身>阈值
  if (aLoad >= aTie * 1.8 && aLoad >= 80) return "load";
  if (aTie >= aLoad * 1.8 && aTie >= 60) return "tieLine";
  return "mixed";
}

export const spreadFactorHourly: SpreadFactorRow[] = Array.from({ length: 24 }, (_, h) => {
  const slice = (arr: number[]) => arr.slice(h * 4, h * 4 + 4);
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

  const spread = Math.round(avg(slice(price96.map((p) => p.realtime - p.dayAhead))));
  const loadDev = Math.round(avg(slice(load96.map((l) => l.deviation))));
  const tieActualAvg = avg(slice(boundary96.map((b) => b.tieLine)));
  const tiePlanAvg = avg(slice(tieLinePlan96));
  const tieLineDev = Math.round(tieActualAvg - tiePlanAvg);

  return {
    hour: h,
    hourLabel: `${String(h).padStart(2, "0")}:00`,
    periodRange: `${h * 4 + 1}-${h * 4 + 4}`,
    spread,
    loadDev,
    tieLineDev,
    driver: classifyDriver(spread, loadDev, tieLineDev),
  };
});

export const SPREAD_DRIVER_LABEL: Record<SpreadDriver, string> = {
  load: "负荷偏差主导",
  tieLine: "联络线偏差主导",
  mixed: "多因子叠加",
  none: "暂无明显主导因子",
};

// 顶部摘要
const dayAheadAvg = Math.round(price96.reduce((s, p) => s + p.dayAhead, 0) / 96);
const realtimeAvg = Math.round(price96.reduce((s, p) => s + p.realtime, 0) / 96);
export const summary = [
  { label: "日前均价", value: dayAheadAvg, unit: "元/MWh", change: "+3.2%", up: true },
  { label: "实时均价", value: realtimeAvg, unit: "元/MWh", change: "-1.1%", up: false },
  { label: "日前-实时价差", value: realtimeAvg - dayAheadAvg, unit: "元/MWh", change: "扩大", up: true },
  { label: "最大负荷", value: Math.max(...load96.map((l) => l.actual)).toLocaleString(), unit: "MW", change: "+5.8%", up: true },
  { label: "新能源预测(峰)", value: Math.max(...renewable96.map((r) => r.total)).toLocaleString(), unit: "MW", change: "+2.1%", up: true },
  { label: "竞价空间(峰)", value: Math.max(...space96.map((b) => b.space)).toLocaleString(), unit: "MW", change: "—", up: true },
  { label: "正备用", value: 520, unit: "MW", change: "正常", up: true },
  { label: "负备用", value: 380, unit: "MW", change: "正常", up: true },
];

// 边界静态信息（卡片）
export const boundaryRows = [
  { item: "联络线外送计划", value: "+850 MW", note: "向华东送电", trendKey: "tieLine" as const },
  { item: "皖南-皖北断面限额", value: "2,400 MW", note: "当前负载 78%", trendKey: "sectionLoad" as const },
  { item: "必开机组容量", value: "1,200 MW", note: "3 台火电", trendKey: null },
  { item: "必停机组容量", value: "320 MW", note: "1 台检修", trendKey: null },
  { item: "非市场化机组出力", value: "640 MW", note: "核电基荷", trendKey: null },
  { item: "正备用 / 负备用", value: "520 / 380 MW", note: "正常区间", trendKey: "reservePos" as const },
];

// 公告 + 异常
export interface MarketEvent {
  id: string;
  level: "high" | "medium" | "info";
  category: "公告" | "规则" | "异常" | "预警";
  title: string;
  detail: string;
  time: string;
  source?: string;
}
export const marketEvents: MarketEvent[] = [
  {
    id: "e1",
    level: "high",
    category: "异常",
    title: "18:00-20:00 实时价差扩大至 +47 元/MWh",
    detail: "晚高峰期间实时电价显著高于日前结算价，建议关注晚间申报策略，避免反向偏差扣款。",
    time: "10:32",
  },
  {
    id: "e2",
    level: "high",
    category: "预警",
    title: "皖南-皖北断面接近限额（78%）",
    detail: "关键输电断面负载率持续攀升，调度可能压减外送计划，影响夜间出清结果。",
    time: "10:18",
  },
  {
    id: "e3",
    level: "medium",
    category: "异常",
    title: "新能源预测偏差 -12%",
    detail: "11:00-13:00 光伏实际出力低于预测约 180 MW，竞价空间相应放大。",
    time: "09:55",
  },
  {
    id: "e4",
    level: "info",
    category: "公告",
    title: "2025 年 7 月第三周现货交易出清结果发布",
    detail: "交易中心已发布 2025-07-08 至 2025-07-14 现货交易出清结果，请相关市场主体核对。",
    time: "07-15 10:30",
    source: "交易中心",
  },
  {
    id: "e5",
    level: "info",
    category: "规则",
    title: "调整 2025 年下半年中长期交易时间",
    detail: "中长期月度集中竞价交易时间由每月 15 日调整为每月 12 日，请相关单位提前安排。",
    time: "07-12 11:00",
    source: "省能源局",
  },
  {
    id: "e6",
    level: "info",
    category: "公告",
    title: "安徽省 2025 年 8 月月度集中竞价交易公告",
    detail: "8 月月度集中竞价拟于 7 月 25 日开市，标的电量约 32 亿千瓦时。",
    time: "07-14 16:00",
    source: "交易中心",
  },
];
