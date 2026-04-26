import { useMemo } from "react";
import {
  spreadFactorHourly,
  SPREAD_DRIVER_LABEL,
  type SpreadDriver,
  type Granularity,
} from "@/lib/marketMocks";
import { useMarketCursor } from "@/contexts/MarketCursorContext";
import { cn } from "@/lib/utils";

// 颜色：正值 → 暖色（destructive 系），负值 → 冷色（primary 系）
// 强度根据本列绝对值最大值进行归一化，绝对值越大颜色越深
function intensityCell(value: number, maxAbs: number, kind: "warm" | "cool") {
  if (maxAbs === 0) return { background: "transparent", color: "hsl(var(--muted-foreground))" };
  const t = Math.min(1, Math.abs(value) / maxAbs);
  // 颜色 alpha 0.08 ~ 0.55
  const alpha = 0.08 + t * 0.47;
  const hsl =
    kind === "warm"
      ? `hsl(var(--destructive) / ${alpha.toFixed(2)})`
      : `hsl(var(--primary) / ${alpha.toFixed(2)})`;
  const fg = t > 0.55 ? (kind === "warm" ? "hsl(var(--destructive))" : "hsl(var(--primary))") : "hsl(var(--foreground))";
  return { background: hsl, color: fg };
}

const driverBadge: Record<SpreadDriver, string> = {
  load: "bg-primary/10 text-primary",
  tieLine: "bg-warning/15 text-warning",
  mixed: "bg-muted text-foreground",
  none: "bg-secondary text-muted-foreground",
};

export interface SpreadFactorMatrixProps {
  /** 当 hour 粒度下，主图 hover/click 的 idx 即为小时；15min 时为 0..95，需除以 4 */
  granularity: Granularity;
}

export function SpreadFactorMatrix({ granularity }: SpreadFactorMatrixProps) {
  const { hoverIdx, setHoverIdx } = useMarketCursor();

  const rows = spreadFactorHourly;

  const maxAbs = useMemo(
    () => ({
      spread: Math.max(...rows.map((r) => Math.abs(r.spread)), 1),
      loadDev: Math.max(...rows.map((r) => Math.abs(r.loadDev)), 1),
      tieLineDev: Math.max(...rows.map((r) => Math.abs(r.tieLineDev)), 1),
    }),
    [rows],
  );

  // 主图 hover 索引 → 对应小时
  const activeHour =
    hoverIdx == null ? null : granularity === "day" ? null : granularity === "hour" ? hoverIdx : Math.floor(hoverIdx / 4);

  const onRowEnter = (h: number) => {
    // 写回 cursor：hour 粒度直接写小时；15min 粒度写该小时的中点（h*4+2）
    setHoverIdx(granularity === "day" ? null : granularity === "hour" ? h : h * 4 + 2);
  };
  const onRowLeave = () => setHoverIdx(null);

  return (
    <section className="rounded-lg shadow-notion bg-card p-4">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-mono text-muted-foreground">#1.1</span>
          <h3 className="text-sm font-semibold">价差影响因子对照</h3>
          <span className="text-[11px] text-muted-foreground hidden md:inline">
            · 24 时段矩阵 · 仅展示 SP1 已确认数据列
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm" style={{ background: "hsl(var(--destructive) / 0.45)" }} />
            正值
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm" style={{ background: "hsl(var(--primary) / 0.45)" }} />
            负值
          </span>
          <span>· 颜色越深绝对值越大</span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mb-2">
        口径：价差 = 日前电价 − 实时电价 ；负荷差 = 实际负荷 − 日前负荷预测 ；联络线差 = 实际输电总量 − 日前联络线计划总量。
        候选主因仅为候选判断，非系统已确认真实原因。
      </p>

      <div className="border rounded overflow-hidden">
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-secondary sticky top-0 z-10">
              <tr>
                <th className="text-left px-3 py-1.5 font-medium w-20">时段</th>
                <th className="text-right px-3 py-1.5 font-medium">价差<span className="text-muted-foreground font-normal"> (元/MWh)</span></th>
                <th className="text-right px-3 py-1.5 font-medium">负荷差<span className="text-muted-foreground font-normal"> (MW)</span></th>
                <th className="text-right px-3 py-1.5 font-medium">联络线差<span className="text-muted-foreground font-normal"> (MW)</span></th>
                <th className="text-left px-3 py-1.5 font-medium w-32">候选主因</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const active = activeHour === r.hour;
                const sCell = intensityCell(r.spread, maxAbs.spread, r.spread >= 0 ? "warm" : "cool");
                const lCell = intensityCell(r.loadDev, maxAbs.loadDev, r.loadDev >= 0 ? "warm" : "cool");
                const tCell = intensityCell(r.tieLineDev, maxAbs.tieLineDev, r.tieLineDev >= 0 ? "warm" : "cool");
                return (
                  <tr
                    key={r.hour}
                    className={cn(
                      "border-t cursor-pointer transition-colors",
                      active ? "bg-primary/5 ring-1 ring-inset ring-primary/40" : "hover:bg-secondary/40",
                    )}
                    onMouseEnter={() => onRowEnter(r.hour)}
                    onMouseLeave={onRowLeave}
                    onClick={() => onRowEnter(r.hour)}
                  >
                    <td className="px-3 py-1 font-mono">
                      {r.hourLabel}
                      <span className="text-muted-foreground ml-1 text-[10px]">·{r.periodRange}</span>
                    </td>
                    <td className="px-3 py-1 font-mono text-right" style={sCell}>
                      {r.spread > 0 ? "+" : ""}{r.spread}
                    </td>
                    <td className="px-3 py-1 font-mono text-right" style={lCell}>
                      {r.loadDev > 0 ? "+" : ""}{r.loadDev.toLocaleString()}
                    </td>
                    <td className="px-3 py-1 font-mono text-right" style={tCell}>
                      {r.tieLineDev > 0 ? "+" : ""}{r.tieLineDev.toLocaleString()}
                    </td>
                    <td className="px-3 py-1">
                      <span className={cn("inline-block px-1.5 py-0.5 rounded text-[10px]", driverBadge[r.driver])}>
                        {SPREAD_DRIVER_LABEL[r.driver]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span>候选主因：</span>
          {(["load", "tieLine", "mixed", "none"] as SpreadDriver[]).map((d) => (
            <span key={d} className={cn("px-1.5 py-0.5 rounded", driverBadge[d])}>
              {SPREAD_DRIVER_LABEL[d]}
            </span>
          ))}
        </div>
        <span>悬停/点击行可与上方主图联动</span>
      </div>
    </section>
  );
}
