import { useMemo, useState } from "react";
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
} from "recharts";
import { AlertTriangle, Info } from "lucide-react";

type TabKey = "load" | "renewable" | "space" | "price" | "factor";
type Granularity = "15min" | "hour";

const tabs: { key: TabKey; label: string }[] = [
  { key: "load", label: "负荷预测" },
  { key: "renewable", label: "新能源出力" },
  { key: "space", label: "竞价空间" },
  { key: "price", label: "价格预测" },
  { key: "factor", label: "因子分析" },
];

// ===== 96 点 15 分钟基础 Mock 数据 =====
function pointLabel(idx: number) {
  const m = idx * 15;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
// 确定性伪随机，避免 setState 抖动
function seeded(seed: number) {
  return Math.sin(seed * 9301 + 49297) * 0.5 + 0.5;
}

interface SeriesPoint {
  idx: number;
  label: string; // 15 分钟模式 X 轴
  hourLabel: string; // 1 小时模式 X 轴
  period: string; // 时段编号 1-96
  periodRange: string; // 1 小时聚合时显示 "1-4"
  predicted: number;
  actual: number;
  deviation: number;
  deviationPct: string;
}

function gen96(base: number, amp: number, noise: number, salt: number): SeriesPoint[] {
  return Array.from({ length: 96 }, (_, i) => {
    const t = (i - 24) / 96;
    const v = base + Math.sin(t * Math.PI * 2) * amp + 100;
    const predicted = Math.round(v);
    const actual = Math.round(v + (seeded(i + salt) - 0.5) * noise);
    const deviation = actual - predicted;
    const h = Math.floor(i / 4);
    return {
      idx: i,
      label: pointLabel(i),
      hourLabel: `${String(h).padStart(2, "0")}:00`,
      period: String(i + 1),
      periodRange: `${h * 4 + 1}-${h * 4 + 4}`,
      predicted,
      actual,
      deviation,
      deviationPct: ((deviation / predicted) * 100).toFixed(1),
    };
  });
}

// 96 → 24 聚合（每 4 个点取均值）
function aggregate(points: SeriesPoint[]): SeriesPoint[] {
  return Array.from({ length: 24 }, (_, h) => {
    const slice = points.slice(h * 4, h * 4 + 4);
    const predicted = Math.round(slice.reduce((s, p) => s + p.predicted, 0) / 4);
    const actual = Math.round(slice.reduce((s, p) => s + p.actual, 0) / 4);
    const deviation = actual - predicted;
    return {
      idx: h * 4,
      label: `${String(h).padStart(2, "0")}:00`,
      hourLabel: `${String(h).padStart(2, "0")}:00`,
      period: `${h * 4 + 1}-${h * 4 + 4}`,
      periodRange: `${h * 4 + 1}-${h * 4 + 4}`,
      predicted,
      actual,
      deviation,
      deviationPct: ((deviation / predicted) * 100).toFixed(1),
    };
  });
}

const dataMap: Record<TabKey, any> = {
  load: {
    series: gen96(3200, 1200, 200, 0),
    unit: "MW",
    metrics: [
      { label: "MAPE", value: "2.3%", desc: "平均绝对百分比误差" },
      { label: "RMSE", value: "45.2 MW", desc: "均方根误差" },
      { label: "准确率", value: "97.7%", desc: "96 时段滚动" },
      { label: "数据覆盖", value: "100%", desc: "96/96 时段" },
    ],
    factors: ["气温", "节假日", "工业生产负荷", "前一日同时段负荷"],
    anomalies: ["08:00 实际负荷超预测 6.2%", "21:00 实际负荷低于预测 4.1%"],
    gaps: ["无"],
  },
  renewable: {
    series: genSeries(800, 700, 220),
    unit: "MW",
    metrics: [
      { label: "MAPE", value: "8.1%", desc: "新能源波动较大" },
      { label: "RMSE", value: "98.5 MW", desc: "" },
      { label: "准确率", value: "91.9%", desc: "受天气影响" },
      { label: "数据覆盖", value: "98%", desc: "缺 02:00-02:15" },
    ],
    factors: ["云量预报", "辐照度", "风速", "温度"],
    anomalies: ["12:30 光伏出力低于预测 18%（云团过境）"],
    gaps: ["02:00-02:15 SCADA 数据缺失"],
  },
  space: {
    series: genSeries(2400, 800, 200),
    unit: "MW",
    metrics: [
      { label: "MAPE", value: "4.5%", desc: "" },
      { label: "RMSE", value: "62.3 MW", desc: "" },
      { label: "准确率", value: "95.5%", desc: "" },
      { label: "数据覆盖", value: "100%", desc: "" },
    ],
    factors: ["总负荷预测", "新能源预测", "联络线计划", "必开机组"],
    anomalies: ["13:00 竞价空间预警（< 800 MW）"],
    gaps: ["无"],
  },
  price: {
    series: genSeries(380, 120, 35),
    unit: "元/MWh",
    metrics: [
      { label: "MAPE", value: "9.4%", desc: "" },
      { label: "RMSE", value: "38.6 元", desc: "" },
      { label: "准确率", value: "90.6%", desc: "" },
      { label: "数据覆盖", value: "100%", desc: "" },
    ],
    factors: ["竞价空间", "新能源出力", "气温", "外来电"],
    anomalies: ["18:00-20:00 实时价格高于预测 12.4%"],
    gaps: ["无"],
  },
  factor: {
    series: genSeries(380, 120, 35),
    unit: "元/MWh",
    metrics: [
      { label: "样本量", value: "30 d", desc: "近 30 日数据" },
      { label: "显著因子", value: "5", desc: "p < 0.05" },
      { label: "拟合 R²", value: "0.86", desc: "" },
      { label: "更新时间", value: "10:30", desc: "" },
    ],
    factors: [],
    anomalies: [],
    gaps: [],
  },
};

const factorRows = [
  { name: "竞价空间", direction: "负相关", strength: 0.78, note: "竞价空间越小，价格越高" },
  { name: "新能源出力", direction: "负相关", strength: 0.65, note: "新能源出力高时压低价格" },
  { name: "气温", direction: "正相关", strength: 0.52, note: "高温推升空调负荷" },
  { name: "外来电", direction: "负相关", strength: 0.41, note: "外来电增加压低本地价格" },
  { name: "日前/实时价差", direction: "正相关", strength: 0.34, note: "日前偏高时实时趋同" },
  { name: "报价行为(异常解释)", direction: "—", strength: 0, note: "占位 · SP1 暂不识别" },
];

const C_PRIMARY = "hsl(var(--primary))";
const C_DESTRUCTIVE = "hsl(var(--destructive))";

export default function Prediction() {
  const [active, setActive] = useState<TabKey>("load");
  const data = dataMap[active];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="text-xl font-semibold">算法预测</h1>
        <p className="text-xs text-muted-foreground">专项预测钻取 · 主看盘请前往「市场看板」</p>
      </div>

      <div className="flex gap-1 mb-5 border-b mt-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-3 py-2 text-sm border-b-2 transition-colors ${
              active === t.key
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {data.metrics.map((m: any) => (
          <div key={m.label} className="p-4 rounded-lg shadow-notion bg-card">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-lg font-semibold mt-1">{m.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
          </div>
        ))}
      </div>

      {active !== "factor" && (
        <>
          {/* 主图：预测 vs 实际 */}
          <div className="rounded-lg shadow-notion bg-card p-5 mb-5">
            <h3 className="text-sm font-semibold mb-3">
              预测 vs 实际（{data.unit}）
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    formatter={(v: number, name: string, p: any) => {
                      const period = p?.payload?.period;
                      return [v, `${name}${period ? ` (时段 ${period})` : ""}`];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="predicted" name="预测" stroke={C_PRIMARY} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="actual" name="实际" stroke={C_PRIMARY} strokeWidth={2} dot={false} />
                  <Bar yAxisId="right" dataKey="deviation" name="偏差" fill={C_DESTRUCTIVE} fillOpacity={0.4} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detail table */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div className="rounded-lg shadow-notion bg-card overflow-hidden md:col-span-2">
              <div className="px-4 py-2.5 border-b bg-secondary/50">
                <h3 className="text-sm font-semibold">明细</h3>
              </div>
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b">
                      <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">时段</th>
                      <th className="text-right px-4 py-2 font-medium text-xs text-muted-foreground">预测</th>
                      <th className="text-right px-4 py-2 font-medium text-xs text-muted-foreground">实际</th>
                      <th className="text-right px-4 py-2 font-medium text-xs text-muted-foreground">偏差</th>
                      <th className="text-right px-4 py-2 font-medium text-xs text-muted-foreground">偏差率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.series.slice(0, 12).map((d: any) => (
                      <tr key={d.hour} className="border-b last:border-b-0">
                        <td className="px-4 py-1.5 text-xs">
                          {d.hour} <span className="text-muted-foreground">({d.period})</span>
                        </td>
                        <td className="px-4 py-1.5 text-right text-muted-foreground text-xs">
                          {d.predicted.toLocaleString()}
                        </td>
                        <td className="px-4 py-1.5 text-right text-xs">{d.actual.toLocaleString()}</td>
                        <td className={`px-4 py-1.5 text-right text-xs ${d.deviation >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                          {d.deviation >= 0 ? "+" : ""}{d.deviation}
                        </td>
                        <td className={`px-4 py-1.5 text-right text-xs ${d.deviation >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                          {d.deviation >= 0 ? "+" : ""}{d.deviationPct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 解释区 */}
            <div className="rounded-lg shadow-notion bg-card p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">主要影响因子</p>
                <div className="flex flex-wrap gap-1">
                  {data.factors.map((f: string) => (
                    <span key={f} className="text-[11px] px-2 py-0.5 rounded bg-secondary">{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">异常点</p>
                {data.anomalies.length === 0 ? (
                  <p className="text-xs text-muted-foreground">无</p>
                ) : (
                  data.anomalies.map((a: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs mb-1 text-destructive">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{a}</span>
                    </div>
                  ))
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">数据缺口</p>
                {data.gaps.map((g: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs mb-1 text-muted-foreground">
                    <Info className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 因子分析 */}
      {active === "factor" && (
        <div className="space-y-5">
          <div className="rounded-lg shadow-notion bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b bg-secondary/50">
              <h3 className="text-sm font-semibold">因子相关性（对实时电价）</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">因子</th>
                  <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">影响方向</th>
                  <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">相关性强弱</th>
                  <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">备注</th>
                </tr>
              </thead>
              <tbody>
                {factorRows.map((r) => (
                  <tr key={r.name} className="border-b last:border-b-0">
                    <td className="px-4 py-2 text-sm">{r.name}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={r.direction === "正相关" ? "text-[hsl(var(--success))]" : r.direction === "负相关" ? "text-destructive" : "text-muted-foreground"}>
                        {r.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${r.strength * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{r.strength.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-dashed bg-card/50 p-4 text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1.5"><Info className="h-3 w-3" /> SP1 能力边界说明：</p>
            <p>· 「蓄意抬价 / 报价行为」仅作为异常解释占位，系统暂不自动识别。</p>
            <p>· 「申报比例推荐」非 SP1 范围，作为后续算法能力占位。</p>
          </div>
        </div>
      )}
    </div>
  );
}
