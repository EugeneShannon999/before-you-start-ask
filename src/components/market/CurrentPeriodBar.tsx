import { useMarketCursor } from "@/contexts/MarketCursorContext";
import {
  price96,
  load96,
  renewable96,
  space96,
  Granularity,
  aggregateToHour,
  SPACE_WARN_THRESHOLD,
} from "@/lib/marketMocks";
import { useMemo } from "react";
import { Activity } from "lucide-react";

export function CurrentPeriodBar({ granularity }: { granularity: Granularity }) {
  const { hoverIdx } = useMarketCursor();

  const snapshot = useMemo(() => {
    if (hoverIdx == null) return null;

    if (granularity === "15min") {
      const i = hoverIdx;
      if (i < 0 || i >= 96) return null;
      return {
        label: `${price96[i].label} (时段 ${i + 1})`,
        dayAhead: price96[i].dayAhead,
        realtime: price96[i].realtime,
        spread: price96[i].spread,
        predicted: load96[i].predicted,
        actual: load96[i].actual,
        renewable: renewable96[i].total,
        space: space96[i].space,
        warning: space96[i].warning,
      };
    }
    const h = hoverIdx;
    if (h < 0 || h >= 24) return null;
    const priceH = aggregateToHour(price96, ["dayAhead", "realtime", "spread"])[h];
    const loadH = aggregateToHour(load96, ["predicted", "actual"])[h];
    const renH = aggregateToHour(renewable96, ["total"])[h];
    const spaceH = aggregateToHour(space96, ["space"])[h];
    return {
      label: `${String(h).padStart(2, "0")}:00-${String(h + 1).padStart(2, "0")}:00 (时段 ${h * 4 + 1}-${h * 4 + 4})`,
      dayAhead: (priceH as any).dayAhead,
      realtime: (priceH as any).realtime,
      spread: (priceH as any).spread,
      predicted: (loadH as any).predicted,
      actual: (loadH as any).actual,
      renewable: (renH as any).total,
      space: (spaceH as any).space,
      warning: (spaceH as any).space < SPACE_WARN_THRESHOLD,
    };
  }, [hoverIdx, granularity]);

  return (
    <div className="rounded-lg shadow-notion bg-card border px-3 py-2 flex items-center gap-3 flex-wrap text-[11px]">
      <span className="flex items-center gap-1 text-muted-foreground shrink-0">
        <Activity className="h-3 w-3" />
        当前时段：
      </span>
      {snapshot ? (
        <>
          <span className="font-mono font-semibold text-foreground">{snapshot.label}</span>
          <Cell label="日前" value={snapshot.dayAhead} unit="元/MWh" />
          <Cell label="实时" value={snapshot.realtime} unit="元/MWh" />
          <Cell label="价差" value={snapshot.spread} unit="元/MWh" colored />
          <Cell label="预测负荷" value={snapshot.predicted} unit="MW" />
          <Cell label="实际负荷" value={snapshot.actual} unit="MW" />
          <Cell label="新能源" value={snapshot.renewable} unit="MW" />
          <Cell
            label="竞价空间"
            value={snapshot.space}
            unit="MW"
            warning={snapshot.warning}
          />
        </>
      ) : (
        <span className="text-muted-foreground">将鼠标悬停在任一图表上以联动查看</span>
      )}
    </div>
  );
}

function Cell({
  label, value, unit, colored, warning,
}: { label: string; value: number; unit: string; colored?: boolean; warning?: boolean }) {
  let cls = "text-foreground";
  if (warning) cls = "text-destructive font-semibold";
  else if (colored) cls = value > 0 ? "text-destructive" : value < 0 ? "text-success" : "text-foreground";
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${cls}`}>{value > 0 && colored ? "+" : ""}{value.toLocaleString()}</span>
      <span className="text-muted-foreground text-[10px]">{unit}</span>
    </span>
  );
}
