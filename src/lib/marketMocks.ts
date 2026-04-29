// 市场看板 mock 数据：96 点(15 分钟) + 小时聚合
export type Granularity = "15min" | "hour" | "day";

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

export type DataSourceTag = "公开API" | "页面抓取" | "规则计算" | "待确认数据源";

export interface WeatherPoint {
  hour: number;
  hourLabel: string;
  temperature: number;
  humidity2m: number;
  dewPoint2m: number;
  windSpeed: number;
  wind10mSpeed: number;
  wind100mSpeed: number;
  irradiance: number;
  directRadiation: number;
  shortwaveRadiation: number;
  lowCloudCover: number;
  midCloudCover: number;
  highCloudCover: number;
  cloudCover: number;
  precipitation: number;
  surfacePrecipRate: number;
  alert: string;
  warningLevel: "正常" | "区域提示" | "市场级提示";
  triggerReason: string;
  affectedArea: string;
  impactTarget: "光伏" | "风电" | "负荷" | "市场波动";
  priorityHint: string;
}

export interface PriceForecastLinkRow {
  hour: number;
  hourLabel: string;
  dayAhead: number;
  realtime: number;
  spread: number;
  predictedPrice: number;
  forecastDeviation: number;
  candidateFactor: string;
}

export interface TradeLedgerRow {
  date: string;
  contract: string;
  period: string;
  side: "买入" | "卖出";
  quantity: number;
  dealPrice: number;
  settlementPrice: number;
  deviation: number;
  pnl: number;
  note: string;
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
    spread: dayAhead - realtime,
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
  if (granularity === "day") {
    const dayAvg = <T extends { idx: number }>(arr: T[], numericKeys: (keyof T)[]) => {
      const merged: any = { ...arr[0], label: "24小时", hourLabel: "全天", periodRange: "1-96" };
      numericKeys.forEach((k) => {
        merged[k] = Math.round(arr.reduce((s, p) => s + (p[k] as number), 0) / arr.length);
      });
      return [merged];
    };
    return {
      price: dayAvg(price96, ["dayAhead", "realtime", "spread", "cleared"]),
      load: dayAvg(load96, ["predicted", "actual", "deviation"]),
      renewable: dayAvg(renewable96, ["solar", "wind", "total"]),
      space: dayAvg(space96, ["load", "renewable", "space"]).map((s: any) => ({ ...s, warning: s.space < SPACE_WARN_THRESHOLD })),
      boundary: dayAvg(boundary96, ["tieLine", "sectionLoad", "reservePos", "reserveNeg"]),
      xKey: "label" as const,
      xInterval: 0,
      periodLabel: (p: any) => `时段 ${p.periodRange}`,
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

  const spread = Math.round(avg(slice(price96.map((p) => p.dayAhead - p.realtime))));
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
  { label: "日前-实时价差", value: dayAheadAvg - realtimeAvg, unit: "元/MWh", change: "扩大", up: true },
  { label: "最大负荷", value: Math.max(...load96.map((l) => l.actual)).toLocaleString(), unit: "MW", change: "+5.8%", up: true },
  { label: "新能源预测(峰)", value: Math.max(...renewable96.map((r) => r.total)).toLocaleString(), unit: "MW", change: "+2.1%", up: true },
  { label: "竞价空间(峰)", value: Math.max(...space96.map((b) => b.space)).toLocaleString(), unit: "MW", change: "—", up: true },
  { label: "正备用", value: 520, unit: "MW", change: "正常", up: true },
  { label: "负备用", value: 380, unit: "MW", change: "正常", up: true },
];

export const weatherSources: Array<{ name: string; source: DataSourceTag; status: string }> = [
  { name: "EC", source: "公开API", status: "已接入" },
  { name: "中科天机", source: "页面抓取", status: "已接入" },
];

export const weather24: WeatherPoint[] = Array.from({ length: 24 }, (_, hour) => {
  const idx = hour * 4;
  const solar = renewable96[idx].solar;
  const wind = renewable96[idx].wind;
  const lowCloudCover = Math.max(5, Math.min(88, Math.round(72 - solar / 22 + seeded(hour + 900) * 18)));
  const midCloudCover = Math.max(6, Math.min(86, Math.round(48 + seeded(hour + 910) * 28)));
  const highCloudCover = Math.max(8, Math.min(92, Math.round(36 + seeded(hour + 920) * 36)));
  const cloudCover = Math.max(lowCloudCover, Math.round((lowCloudCover + midCloudCover + highCloudCover) / 2.4));
  const precipitation = Math.max(0, Number((seeded(hour + 940) * 2.6 - 0.4).toFixed(1)));
  const temperature = Math.round(24 + Math.sin(((hour - 6) / 24) * Math.PI * 2) * 7 + seeded(hour + 980) * 2);
  const humidity2m = Math.max(38, Math.min(96, Math.round(58 + precipitation * 12 + cloudCover * 0.22 + seeded(hour + 990) * 10)));
  const dewPoint2m = Math.round(temperature - (100 - humidity2m) / 5);
  const wind10mSpeed = Number((3.4 + wind / 260 + seeded(hour + 1020) * 1.6).toFixed(1));
  const wind100mSpeed = Number((wind10mSpeed * 1.42 + seeded(hour + 1030) * 1.1).toFixed(1));
  const windSpeed = wind10mSpeed;
  const irradiance = Math.max(0, Math.round(solar * 0.9));
  const directRadiation = Math.max(0, Math.round(irradiance * (1 - lowCloudCover / 130)));
  const shortwaveRadiation = Math.max(0, Math.round(irradiance * (1 - cloudCover / 180) + seeded(hour + 960) * 35));
  const surfacePrecipRate = Number((precipitation / 1.5 + seeded(hour + 970) * 0.25).toFixed(2));
  const factors = [wind100mSpeed > 8.6, precipitation > 1.6, cloudCover > 78, directRadiation < 180, temperature >= 34 || temperature <= 18].filter(Boolean).length;
  const alert = factors >= 2 ? "多因素叠加影响新能源出力" : precipitation > 1.6 ? "短时降水预警" : wind100mSpeed > 8.6 ? "大风关注" : cloudCover > 78 ? "厚云层关注" : temperature >= 34 || temperature <= 18 ? "温度异常关注" : "无";
  const warningLevel = factors >= 3 ? "市场级提示" : factors >= 1 ? "区域提示" : "正常";
  const impactTarget = factors >= 3 ? "市场波动" : directRadiation < 180 || cloudCover > 78 ? "光伏" : wind100mSpeed > 8.6 ? "风电" : temperature >= 34 || temperature <= 18 ? "负荷" : "光伏";
  const affectedArea = warningLevel === "市场级提示" ? "皖北、皖中多区域" : impactTarget === "负荷" ? "合肥负荷中心" : impactTarget === "风电" ? "沿江风电区域" : "皖北新能源场站";
  const triggerReason = alert === "无" ? "未触发业务阈值或分位兜底" : `${alert} · 阈值配置预留`;
  const priorityHint = factors >= 2 ? "与新能源预测偏差或负荷偏差同向时提高提醒优先级" : "常规留痕";
  return {
    hour,
    hourLabel: `${String(hour).padStart(2, "0")}:00`,
    temperature,
    humidity2m,
    dewPoint2m,
    windSpeed,
    wind10mSpeed,
    wind100mSpeed,
    irradiance,
    directRadiation,
    shortwaveRadiation,
    lowCloudCover,
    midCloudCover,
    highCloudCover,
    cloudCover,
    precipitation,
    surfacePrecipRate,
    alert,
    warningLevel,
    triggerReason,
    affectedArea,
    impactTarget,
    priorityHint,
  };
});

export const priceForecastLink24: PriceForecastLinkRow[] = Array.from({ length: 24 }, (_, hour) => {
  const base = aggregateToHour(price96, ["dayAhead", "realtime", "spread", "cleared"])[hour];
  const weather = weather24[hour];
  const space = aggregateToHour(space96, ["load", "renewable", "space"])[hour];
  const adjustment = Math.round((weather.windSpeed - 5.5) * -6 + (weather.cloudCover - 55) * 0.4 + (800 - space.space) * 0.03);
  const predictedPrice = base.dayAhead + adjustment;
  const forecastDeviation = predictedPrice - base.realtime;
  const candidateFactor =
    weather.irradiance < 220 ? "辐照偏弱 / 光伏侧压力" :
    weather.windSpeed > 6.8 ? "风速抬升 / 新能源侧修正" :
    space.space < SPACE_WARN_THRESHOLD ? "竞价空间偏紧" :
    Math.abs(base.spread) > 28 ? "价差延续" : "多因子综合";
  return {
    hour,
    hourLabel: base.hourLabel,
    dayAhead: base.dayAhead,
    realtime: base.realtime,
    spread: base.spread,
    predictedPrice,
    forecastDeviation,
    candidateFactor,
  };
});

export const tradeLedgerRows: TradeLedgerRow[] = [
  { date: "2025-07-15", contract: "皖电现货·日前", period: "09:00-10:00", side: "卖出", quantity: 1200, dealPrice: 426, settlementPrice: 418, deviation: 8, pnl: 9600, note: "负荷兑现高于预期" },
  { date: "2025-07-15", contract: "皖电现货·实时", period: "18:00-19:00", side: "买入", quantity: 800, dealPrice: 482, settlementPrice: 496, deviation: -14, pnl: -11200, note: "晚峰补仓" },
  { date: "2025-07-14", contract: "月度集中竞价", period: "13-16时段", side: "卖出", quantity: 3000, dealPrice: 392, settlementPrice: 401, deviation: -9, pnl: -27000, note: "高云量导致修正" },
  { date: "2025-07-14", contract: "省间交易·外送", period: "20:00-22:00", side: "卖出", quantity: 1800, dealPrice: 438, settlementPrice: 431, deviation: 7, pnl: 12600, note: "联络线偏差收窄" },
  { date: "2025-07-13", contract: "皖电现货·实时", period: "11:00-12:00", side: "买入", quantity: 650, dealPrice: 355, settlementPrice: 348, deviation: 7, pnl: 4550, note: "午间回落" },
  { date: "2025-07-13", contract: "辅助服务分摊", period: "全日", side: "卖出", quantity: 2200, dealPrice: 88, settlementPrice: 92, deviation: -4, pnl: -8800, note: "分摊上修" },
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

export type BiddingDayOffset = "D-1" | "D-2" | "D-3" | "D-5";
export const biddingSpaceByOffset: Record<BiddingDayOffset, SpacePoint[]> = {
  "D-1": space96,
  "D-2": space96.map((p, i) => ({ ...p, space: Math.max(0, p.space + Math.round((seeded(i + 1200) - 0.5) * 180)), warning: p.space < SPACE_WARN_THRESHOLD + 80 })),
  "D-3": space96.map((p, i) => ({ ...p, space: Math.max(0, p.space + Math.round((seeded(i + 1300) - 0.5) * 260)), warning: p.space < SPACE_WARN_THRESHOLD + 120 })),
  "D-5": space96.map((p, i) => ({ ...p, space: Math.max(0, p.space + Math.round((seeded(i + 1500) - 0.5) * 360)), warning: p.space < SPACE_WARN_THRESHOLD + 180 })),
};

export const marketBoundaryCore = {
  thermalCapacity: { online: 18500, maintenance: 1650, total: 20150, note: "口径待业务确认" },
  mustRun: { mw: 1260, units: 6 },
  mustStop: { mw: 420, units: 2 },
  reserve: [
    { name: "正备用", value: 1820, d1Change: -180, monthChange: -420, source: "公开披露" },
    { name: "负备用", value: 940, d1Change: 75, monthChange: -110, source: "公开披露" },
  ],
};

export interface ThermalUnit {
  id: string;
  name: string;
  capacity: number;
  realtimeOutput: number;
  realtimeLoadRate: number;
  rollingAvgLoadRate: number;
}

export const thermalUnits: ThermalUnit[] = Array.from({ length: 70 }, (_, i) => {
  const capacity = 260 + (i % 8) * 55 + Math.round(seeded(i + 2000) * 80);
  const realtimeLoadRate = Math.round(48 + seeded(i + 2100) * 48);
  const rollingAvgLoadRate = Math.round(45 + seeded(i + 2200) * 46);
  return {
    id: `TU-${String(i + 1).padStart(2, "0")}`,
    name: `火电机组 ${String(i + 1).padStart(2, "0")}`,
    capacity,
    realtimeOutput: Math.round((capacity * realtimeLoadRate) / 100),
    realtimeLoadRate,
    rollingAvgLoadRate,
  };
});

export const thermalRealtimeSummary = {
  totalOutput: thermalUnits.reduce((sum, u) => sum + u.realtimeOutput, 0),
  avgRealtimeLoadRate: Math.round(thermalUnits.reduce((sum, u) => sum + u.realtimeLoadRate, 0) / thermalUnits.length),
  avgRollingLoadRate: Math.round(thermalUnits.reduce((sum, u) => sum + u.rollingAvgLoadRate, 0) / thermalUnits.length),
};

export function getThermalMonthlyProfile(unitId: string) {
  const unit = thermalUnits.find((u) => u.id === unitId) ?? thermalUnits[0];
  const points = Array.from({ length: 96 }, (_, idx) => {
    const value = Math.max(32, Math.min(98, Math.round(unit.rollingAvgLoadRate + Math.sin(idx / 10) * 8 + (seeded(idx + unit.capacity) - 0.5) * 10)));
    return { idx, label: pointLabel(idx), period: String(idx + 1), loadRate: value };
  });
  return {
    unit,
    granularity: "Per 15Mins",
    monthlyAvgLoadRate: Math.round(points.reduce((sum, p) => sum + p.loadRate, 0) / points.length),
    points,
  };
}

export const ruleAlertReports = [
  { dataDate: "D-1", disclosureTime: "10:20", ingestTime: "10:32", delayStatus: "延迟 12 分钟", time: "10:32", ruleName: "竞价空间低于阈值", reason: "晚峰竞价空间连续 4 个时段低于规则阈值", current: "760 MW", threshold: "800 MW", source: "规则计算", target: "晚峰现货申报", action: "复核 D-1 申报边界", status: "待处理" },
  { dataDate: "D-1", disclosureTime: "09:36", ingestTime: "09:45", delayStatus: "延迟 9 分钟", time: "09:45", ruleName: "正备用偏紧", reason: "正备用较上一工作日下降 180 MW", current: "1,820 MW", threshold: "2,000 MW", source: "公开披露", target: "备用敏感时段", action: "关注调度披露更新", status: "已复盘" },
  { dataDate: "D", disclosureTime: "08:44", ingestTime: "08:50", delayStatus: "延迟 6 分钟", time: "08:50", ruleName: "新能源出力偏差", reason: "云量抬升导致预测下修", current: "-9.8%", threshold: "历史P95 8%", source: "公开API", target: "新能源预测", action: "同步修正竞价空间", status: "待处理" },
  { dataDate: "D-2", disclosureTime: "17:12", ingestTime: "D-1 17:20", delayStatus: "跨日入库", time: "D-1 17:20", ruleName: "必开容量变动", reason: "必开机组较 D-2 新增 1 台", current: "1,260 MW / 6台", threshold: "变动即提示", source: "规则计算", target: "火电边界", action: "复核机组约束", status: "已忽略" },
];

export const powerForecastCards = [
  { name: "负荷功率预测", value: Math.max(...load96.map((p) => p.predicted)), unit: "MW", source: "预测模块" },
  { name: "新能源功率预测", value: Math.max(...renewable96.map((p) => p.total)), unit: "MW", source: "预测模块" },
  { name: "火电机组出力预测", value: Math.round(thermalRealtimeSummary.totalOutput * 1.04), unit: "MW", source: "规则框架版" },
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
