import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Area,
  AreaChart,
} from "recharts";
import { useMarketCursor } from "@/contexts/MarketCursorContext";
import type { ForecastMode } from "@/lib/predictionOutputs";

export const C_PRIMARY = "hsl(var(--primary))";
export const C_MUTED = "hsl(var(--muted-foreground))";
export const C_DESTRUCTIVE = "hsl(var(--destructive))";
export const C_SUCCESS = "hsl(var(--success))";
export const C_WARNING = "hsl(var(--warning))";

export interface BaseChartProps {
  data: any[];
  xKey: string;
  xInterval?: number;
  showLegend?: boolean;
  height?: number;
  /** 时段标签函数（用于 tooltip） */
  periodLabel?: (p: any) => string;
}

// 自定义 tooltip wrapper：联动 hover 索引
function useHoverSync(data: any[]) {
  const { setHoverIdx } = useMarketCursor();
  return {
    onMouseMove: (state: any) => {
      if (state && typeof state.activeTooltipIndex === "number") {
        setHoverIdx(state.activeTooltipIndex);
      }
    },
    onMouseLeave: () => setHoverIdx(null),
  };
}

function CursorRef({ data }: { data: any[] }) {
  const { hoverIdx } = useMarketCursor();
  if (hoverIdx == null || hoverIdx < 0 || hoverIdx >= data.length) return null;
  const x = (data[hoverIdx] as any)?.label ?? (data[hoverIdx] as any)?.hourLabel;
  if (!x) return null;
  return <ReferenceLine x={x} stroke={C_PRIMARY} strokeDasharray="2 2" strokeOpacity={0.5} />;
}

const tipStyle = { fontSize: 12, borderRadius: 6 };

// 1. 电价与价差（含出清电量）
export function PriceSpreadChart({
  data, xKey, xInterval, showLegend = true, height = 240, periodLabel,
  visibleSeries = { dayAhead: true, realtime: true, spread: true, cleared: true },
  forecastMode = "all",
}: BaseChartProps & { visibleSeries?: Record<string, boolean>; forecastMode?: ForecastMode }) {
  const sync = useHoverSync(data);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} {...sync}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} interval={xInterval} />
          <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: "元/MWh", position: "insideTopLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: "MWh", position: "insideTopRight", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={tipStyle}
            formatter={(v: number, name: string) => {
              const unit = name === "出清电量" ? "MWh" : "元/MWh";
              return [`${Number(v).toLocaleString()} ${unit}`, name];
            }}
            labelFormatter={(l, payload) => {
              const tag = payload?.[0]?.payload && periodLabel ? periodLabel(payload[0].payload) : "";
              return `${l}${tag ? ` · ${tag}` : ""}`;
            }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
          <CursorRef data={data} />
          {visibleSeries.cleared && (
            <Bar yAxisId="right" dataKey="cleared" name="出清电量" fill={C_MUTED} fillOpacity={0.18} />
          )}
          {visibleSeries.spread && (
            <Bar yAxisId="left" dataKey="spread" name="价差" fill={C_WARNING} fillOpacity={0.35} />
          )}
          {visibleSeries.dayAhead && (
            <Line yAxisId="left" type="monotone" dataKey="dayAhead" name="日前电价" stroke={C_PRIMARY} strokeWidth={2} dot={false} />
          )}
          {visibleSeries.realtime && (
            <Line yAxisId="left" type="monotone" dataKey="realtime" name="实时电价" stroke={C_DESTRUCTIVE} strokeWidth={2} dot={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. 负荷预测 vs 实际
export function LoadForecastChart({
  data, xKey, xInterval, showLegend = true, height = 230, periodLabel,
  visibleSeries = { predicted: true, actual: true, deviation: true },
  forecastMode = "all",
}: BaseChartProps & { visibleSeries?: Record<string, boolean>; forecastMode?: ForecastMode }) {
  const sync = useHoverSync(data);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} {...sync}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} interval={xInterval} />
          <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: "MW", position: "insideTopLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={tipStyle}
            formatter={(v: number, name: string) => [`${Number(v).toLocaleString()} MW`, name]}
            labelFormatter={(l, payload) => {
              const p = payload?.[0]?.payload;
              const tag = p && periodLabel ? periodLabel(p) : "";
              const dev = p ? `偏差 ${p.deviation > 0 ? "+" : ""}${p.deviation} MW (${p.deviationPct ?? ((p.deviation / p.predicted) * 100).toFixed(1)}%)` : "";
              return `${l}${tag ? ` · ${tag}` : ""}${dev ? ` · ${dev}` : ""}`;
            }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
          <CursorRef data={data} />
          {visibleSeries.predicted && <Bar yAxisId="left" dataKey="predicted" name="预测负荷" fill={C_PRIMARY} fillOpacity={0.35} />}
          {visibleSeries.actual && <Bar yAxisId="left" dataKey="actual" name="实际负荷" fill={C_PRIMARY} />}
          {visibleSeries.deviation && <Line yAxisId="right" type="monotone" dataKey="deviation" name="偏差(MW)" stroke={C_DESTRUCTIVE} strokeWidth={1.5} dot={false} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. 新能源出力
export function RenewableChart({
  data, xKey, xInterval, showLegend = true, height = 220, periodLabel,
  visibleSeries = { wind: true, solar: true, total: true },
  forecastMode = "all",
}: BaseChartProps & { visibleSeries?: Record<string, boolean>; forecastMode?: ForecastMode }) {
  const sync = useHoverSync(data);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} {...sync}>
          <defs>
            <linearGradient id="ren-solar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C_PRIMARY} stopOpacity={0.5} />
              <stop offset="100%" stopColor={C_PRIMARY} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="ren-wind" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C_SUCCESS} stopOpacity={0.5} />
              <stop offset="100%" stopColor={C_SUCCESS} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} interval={xInterval} />
          <YAxis tick={{ fontSize: 10 }} label={{ value: "MW", position: "insideTopLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={tipStyle}
            formatter={(v: number, name: string) => [`${Number(v).toLocaleString()} MW`, name]}
            labelFormatter={(l, payload) => {
              const tag = payload?.[0]?.payload && periodLabel ? periodLabel(payload[0].payload) : "";
              return `${l}${tag ? ` · ${tag}` : ""}`;
            }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
          <CursorRef data={data} />
          {"predicted" in (data[0] ?? {}) ? (
            <>
              {forecastMode !== "actual" && forecastMode !== "deviation" && <Area type="monotone" dataKey="predicted" name="预测新能源" stroke={C_PRIMARY} fill="url(#ren-solar)" />}
              {forecastMode !== "predicted" && forecastMode !== "deviation" && <Line type="monotone" dataKey="actual" name="实际新能源" stroke={C_SUCCESS} strokeWidth={2} dot={false} />}
              {forecastMode !== "predicted" && forecastMode !== "actual" && <Line type="monotone" dataKey="deviation" name="偏差" stroke={C_DESTRUCTIVE} strokeWidth={1.5} dot={false} />}
            </>
          ) : <>
          {visibleSeries.wind && (
            <Area type="monotone" dataKey="wind" name="风电" stackId="1" stroke={C_SUCCESS} fill="url(#ren-wind)" />
          )}
          {visibleSeries.solar && (
            <Area type="monotone" dataKey="solar" name="光伏" stackId="1" stroke={C_PRIMARY} fill="url(#ren-solar)" />
          )}
          {visibleSeries.total && (
            <Line type="monotone" dataKey="total" name="新能源总出力" stroke={C_DESTRUCTIVE} strokeWidth={1.5} dot={false} />
          )}
          </>}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// 4. 竞价空间
export function BiddingSpaceChart({
  data, xKey, xInterval, showLegend = true, height = 220, periodLabel,
  threshold = 800,
  forecastMode = "all",
}: BaseChartProps & { threshold?: number; forecastMode?: ForecastMode }) {
  const sync = useHoverSync(data);
  // 找出预警区间（连续 warning=true 段）
  const warnRegions: { x1: any; x2: any }[] = [];
  let start: any = null;
  data.forEach((d, i) => {
    if (d.warning && start == null) start = d[xKey];
    if ((!d.warning || i === data.length - 1) && start != null) {
      warnRegions.push({ x1: start, x2: d[xKey] });
      start = null;
    }
  });

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} {...sync}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} interval={xInterval} />
          <YAxis tick={{ fontSize: 10 }} label={{ value: "MW", position: "insideTopLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={tipStyle}
            formatter={(v: number, name: string) => [`${Number(v).toLocaleString()} MW`, name]}
            labelFormatter={(l, payload) => {
              const p = payload?.[0]?.payload;
              const tag = p && periodLabel ? periodLabel(p) : "";
              const warn = p?.warning ? " · ⚠️ 预警区间" : "";
              return `${l}${tag ? ` · ${tag}` : ""}${warn}`;
            }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {warnRegions.map((r, i) => (
            <ReferenceArea key={i} x1={r.x1} x2={r.x2} fill={C_DESTRUCTIVE} fillOpacity={0.06} />
          ))}
          <ReferenceLine y={threshold} stroke={C_DESTRUCTIVE} strokeDasharray="4 4" label={{ value: `预警 ${threshold} MW`, position: "right", fontSize: 10, fill: C_DESTRUCTIVE }} />
          <CursorRef data={data} />
          {"predicted" in (data[0] ?? {}) ? <>
            {forecastMode !== "actual" && forecastMode !== "deviation" && <Area type="monotone" dataKey="predicted" name="预测竞价空间" stroke={C_PRIMARY} fill={C_PRIMARY} fillOpacity={0.2} />}
            {forecastMode !== "predicted" && forecastMode !== "deviation" && <Line type="monotone" dataKey="actual" name="实际竞价空间" stroke={C_SUCCESS} strokeWidth={2} dot={false} />}
            {forecastMode !== "predicted" && forecastMode !== "actual" && <Line type="monotone" dataKey="deviation" name="偏差" stroke={C_DESTRUCTIVE} strokeWidth={1.5} dot={false} />}
          </> : <>
            <Line type="monotone" dataKey="load" name="总负荷预测" stroke={C_MUTED} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="renewable" name="新能源预测" stroke={C_SUCCESS} strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="space" name="竞价空间" stroke={C_PRIMARY} fill={C_PRIMARY} fillOpacity={0.2} />
          </>}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// 5. 边界 mini 趋势图
export function BoundaryMiniChart({ data, dataKey, color = C_PRIMARY }: { data: any[]; dataKey: string; color?: string }) {
  return (
    <div className="h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.18} strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
