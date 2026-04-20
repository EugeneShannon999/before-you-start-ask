import { ExternalLink, Download, Table2, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Granularity } from "@/lib/marketMocks";

export type RangeKey = "1d" | "7d" | "30d";

export interface ChartToolbarProps {
  chartId: string; // 用于新标签页 URL
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  showLegend: boolean;
  onToggleLegend: () => void;
  onShowTable: () => void;
  onDownload: () => void;
  onReset: () => void;
}

const iconBtn =
  "h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors";

export function ChartToolbar({
  chartId,
  granularity,
  onGranularityChange,
  range,
  onRangeChange,
  showLegend,
  onToggleLegend,
  onShowTable,
  onDownload,
  onReset,
}: ChartToolbarProps) {
  const fullscreenUrl = `/tools/market/chart/${chartId}?g=${granularity}&r=${range}`;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1">
        {/* 粒度切换 */}
        <div className="flex rounded border overflow-hidden text-[10px] mr-1">
          {(["15min", "hour"] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => onGranularityChange(g)}
              className={`px-1.5 py-0.5 ${
                granularity === g
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              {g === "15min" ? "15m" : "1h"}
            </button>
          ))}
        </div>
        {/* 区间切换 */}
        <div className="flex rounded border overflow-hidden text-[10px] mr-1">
          {(["1d", "7d", "30d"] as RangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`px-1.5 py-0.5 ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              {r === "1d" ? "24h" : r === "7d" ? "7日" : "30日"}
            </button>
          ))}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className={iconBtn} onClick={onToggleLegend} aria-label="图例">
              {showLegend ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">{showLegend ? "隐藏图例" : "显示图例"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className={iconBtn} onClick={onShowTable} aria-label="数据表">
              <Table2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">数据表</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className={iconBtn} onClick={onDownload} aria-label="下载">
              <Download className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">下载 CSV</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className={iconBtn} onClick={onReset} aria-label="重置">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">重置缩放</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={fullscreenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={iconBtn}
              aria-label="新标签页放大"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">新标签页放大</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
