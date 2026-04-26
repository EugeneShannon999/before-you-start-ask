import { Download, Table2, RotateCcw, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Granularity } from "@/lib/marketMocks";

export type RangeKey = "1d" | "2d" | "4d" | "7d";

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
  onExpand: () => void;
}

const iconBtn =
  "h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors";
const primaryIconBtn =
  "h-7 w-7 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground shadow-notion hover:bg-primary/90 transition-colors";

export function ChartToolbar({
  onShowTable,
  onDownload,
  onReset,
  onExpand,
}: ChartToolbarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1">
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
            <button className={primaryIconBtn} onClick={onExpand} aria-label="放大图表">
              <Search className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">放大图表</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
