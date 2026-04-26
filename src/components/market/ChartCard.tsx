import { ReactNode, useState } from "react";
import { ChartToolbar, RangeKey } from "./ChartToolbar";
import { Granularity } from "@/lib/marketMocks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ChartCardProps {
  index: number;
  chartId: string;
  title: string;
  caption?: string;
  granularity?: Granularity;
  onGranularityChange?: (g: Granularity) => void;
  range?: RangeKey;
  onRangeChange?: (r: RangeKey) => void;
  showLegend?: boolean;
  onToggleLegend?: () => void;
  // 数据表内容
  tableHeader: string[];
  tableRows: (string | number)[][];
  // CSV 下载内容
  csvFilename: string;
  csvRows: (string | number)[][]; // 含表头
  children: ReactNode;
  footer?: ReactNode;
  expanded?: boolean;
  active?: boolean;
  onActivate?: () => void;
  onExpand: () => void;
  onExpandedChange?: (open: boolean) => void;
  onZoomWheel?: (deltaY: number) => void;
  onResetZoom?: () => void;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ChartCard(props: ChartCardProps) {
  const [tableOpen, setTableOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const chartBody = (
    <div
      key={resetKey}
      onClick={props.onActivate}
      onMouseEnter={props.onActivate}
      onWheel={(event) => {
        event.preventDefault();
        props.onZoomWheel?.(event.deltaY);
      }}
      className={props.active ? "rounded-md ring-1 ring-primary/40" : "rounded-md"}
    >
      {props.children}
    </div>
  );

  return (
    <section className="rounded-lg shadow-notion bg-card p-4">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            #{props.index}
          </span>
          <h3 className="text-sm font-semibold truncate">{props.title}</h3>
          {props.caption && (
            <span className="text-[11px] text-muted-foreground truncate hidden md:inline">
              · {props.caption}
            </span>
          )}
        </div>
        <ChartToolbar
          chartId={props.chartId}
          granularity={props.granularity}
          onGranularityChange={props.onGranularityChange}
          range={props.range}
          onRangeChange={props.onRangeChange}
          showLegend={props.showLegend}
          onToggleLegend={props.onToggleLegend}
          onShowTable={() => setTableOpen(true)}
          onDownload={() => downloadCsv(props.csvFilename, props.csvRows)}
          onReset={() => { setResetKey((k) => k + 1); props.onResetZoom?.(); }}
          onExpand={props.onExpand}
        />
      </div>
      {props.caption && (
        <p className="text-[11px] text-muted-foreground mb-2 md:hidden">
          {props.caption}
        </p>
      )}
      {chartBody}
      {props.footer}

      <Dialog open={tableOpen} onOpenChange={setTableOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm">{props.title} · 数据表</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto border rounded">
            <table className="w-full text-xs">
              <thead className="bg-secondary sticky top-0">
                <tr>
                  {props.tableHeader.map((h) => (
                    <th key={h} className="text-left px-3 py-1.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {props.tableRows.map((row, i) => (
                  <tr key={i} className="border-t hover:bg-secondary/50">
                    {row.map((c, j) => (
                      <td key={j} className="px-3 py-1 font-mono">{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={props.expanded} onOpenChange={props.onExpandedChange}>
        <DialogContent className="max-w-[92vw]">
          <DialogHeader>
            <DialogTitle className="text-sm">{props.title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[78vh] overflow-hidden">{chartBody}</div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
