import { price96, load96, renewable96, space96, type Granularity } from "@/lib/marketMocks";

export type ForecastKind = "load" | "renewable" | "space" | "price";
export type ForecastGranularity = Granularity;
export type ForecastMode = "all" | "predicted" | "actual" | "deviation";

export interface ForecastPoint {
  idx: number;
  date: string;
  label: string;
  hourLabel: string;
  dayLabel: string;
  period: string;
  periodRange: string;
  predicted: number;
  actual: number;
  deviation: number;
  deviationPct: string;
}

export const FORECAST_META: Record<ForecastKind, { label: string; unit: string; factors: string[] }> = {
  load: { label: "负荷预测", unit: "MW", factors: ["气温", "湿度", "工作日负荷", "历史同周期"] },
  renewable: { label: "新能源出力预测", unit: "MW", factors: ["辐照度", "云量", "10/100米风", "场站可用率"] },
  space: { label: "竞价空间预测", unit: "MW", factors: ["总负荷", "新能源出力", "联络线计划", "必开机组"] },
  price: { label: "电价预测", unit: "元/MWh", factors: ["竞价空间", "新能源出力", "气温", "日前/实时价差"] },
};

const dayMs = 24 * 60 * 60 * 1000;

function dateAt(startDate: string, offset: number) {
  const d = new Date(`${startDate}T00:00:00`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function drift(day: number, idx: number, scale: number) {
  return Math.round((Math.sin((day + 1) * 1.7 + idx / 11) + Math.cos(idx / 9)) * scale);
}

function baseValue(kind: ForecastKind, idx: number) {
  if (kind === "load") return { predicted: load96[idx].predicted, actual: load96[idx].actual };
  if (kind === "renewable") return { predicted: renewable96[idx].total, actual: Math.max(0, renewable96[idx].total + drift(0, idx, 70)) };
  if (kind === "space") return { predicted: space96[idx].space, actual: space96[idx].space + drift(1, idx, 90) };
  const predicted = Math.round(price96[idx].dayAhead + (space96[idx].space < 900 ? 28 : -8) + drift(2, idx, 8));
  return { predicted, actual: price96[idx].realtime };
}

function expand96(kind: ForecastKind, startDate: string, days: number): ForecastPoint[] {
  return Array.from({ length: days }).flatMap((_, day) => {
    const date = dateAt(startDate, day);
    return Array.from({ length: 96 }, (_, idx) => {
      const point = baseValue(kind, idx);
      const predicted = Math.max(0, point.predicted + drift(day, idx, kind === "price" ? 4 : 45));
      const actual = Math.max(0, point.actual + drift(day + 3, idx, kind === "price" ? 5 : 55));
      const deviation = actual - predicted;
      const h = Math.floor(idx / 4);
      const m = (idx % 4) * 15;
      return {
        idx: day * 96 + idx,
        date,
        label: `${date.slice(5)} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        hourLabel: `${date.slice(5)} ${String(h).padStart(2, "0")}:00`,
        dayLabel: date.slice(5),
        period: String(idx + 1),
        periodRange: `${h * 4 + 1}-${h * 4 + 4}`,
        predicted,
        actual,
        deviation,
        deviationPct: predicted === 0 ? "0.0" : ((deviation / predicted) * 100).toFixed(1),
      };
    });
  });
}

function avg(points: ForecastPoint[], key: "predicted" | "actual" | "deviation") {
  return Math.round(points.reduce((sum, p) => sum + p[key], 0) / Math.max(points.length, 1));
}

function aggregate(points: ForecastPoint[], granularity: ForecastGranularity): ForecastPoint[] {
  const size = granularity === "hour" ? 4 : granularity === "day" ? 96 : 1;
  if (size === 1) return points;
  const out: ForecastPoint[] = [];
  for (let i = 0; i < points.length; i += size) {
    const slice = points.slice(i, i + size);
    const first = slice[0];
    const predicted = avg(slice, "predicted");
    const actual = avg(slice, "actual");
    const deviation = actual - predicted;
    out.push({
      ...first,
      idx: out.length,
      label: granularity === "day" ? first.dayLabel : first.hourLabel,
      hourLabel: first.hourLabel,
      dayLabel: first.dayLabel,
      predicted,
      actual,
      deviation,
      deviationPct: predicted === 0 ? "0.0" : ((deviation / predicted) * 100).toFixed(1),
    });
  }
  return out;
}

export function getForecastSeries(kind: ForecastKind, startDate: string, endDate: string, granularity: ForecastGranularity) {
  const days = Math.max(1, Math.min(7, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / dayMs) + 1));
  return aggregate(expand96(kind, startDate, days), granularity);
}

export function summarizeForecast(points: ForecastPoint[]) {
  const absPct = points.reduce((sum, p) => sum + Math.abs(Number(p.deviationPct)), 0) / Math.max(points.length, 1);
  const maxDeviation = points.reduce((max, p) => (Math.abs(p.deviation) > Math.abs(max.deviation) ? p : max), points[0]);
  return {
    avgPredicted: avg(points, "predicted"),
    avgActual: avg(points, "actual"),
    avgDeviation: avg(points, "deviation"),
    avgAbsPct: absPct.toFixed(1),
    maxDeviation,
  };
}