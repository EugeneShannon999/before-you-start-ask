import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DatabaseZap, FileWarning, Search } from "lucide-react";
import {
  DataVersion,
  dataVersionStatusLabel,
  mockDataVersions,
} from "@/lib/calculatorMocks";
import { toast } from "sonner";

const statusStyle = (s: string) => {
  switch (s) {
    case "published":
      return "bg-success/10 text-success border-success/30";
    case "validating":
      return "bg-primary/10 text-primary border-primary/30";
    case "warning":
      return "bg-warning/10 text-warning border-warning/30";
    case "failed":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "voided":
      return "bg-muted text-muted-foreground border-border";
    case "missing":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "not_due":
      return "bg-secondary text-muted-foreground border-border";
    default:
      return "bg-secondary text-foreground";
  }
};

type DetailTab = "overview" | "validation" | "trace";

export default function BatchesPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [artifactFilter, setArtifactFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("2026-04");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<DataVersion>(mockDataVersions[0]);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");

  const dataTypes = useMemo(
    () => Array.from(new Set(mockDataVersions.map((v) => v.dataType))),
    []
  );
  const sources = useMemo(
    () => Array.from(new Set(mockDataVersions.map((v) => v.source))),
    []
  );
  const artifactTypes = useMemo(
    () => Array.from(new Set(mockDataVersions.map((v) => v.artifactType))),
    []
  );

  const filtered = useMemo(() => {
    return mockDataVersions.filter((v) => {
      if (typeFilter !== "all" && v.dataType !== typeFilter) return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (sourceFilter !== "all" && v.source !== sourceFilter) return false;
      if (artifactFilter !== "all" && v.artifactType !== artifactFilter) return false;
      if (monthFilter && !v.settleMonth.includes(monthFilter)) return false;
      if (keyword && !`${v.id}${v.pluginTaskId}${v.objectKey}${v.traceNote}`.includes(keyword)) return false;
      return true;
    });
  }, [typeFilter, statusFilter, sourceFilter, artifactFilter, monthFilter, keyword]);

  const selectDetail = (version: DataVersion, tab: DetailTab) => {
    setSelected(version);
    setDetailTab(tab);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">数据版本</h1>
          <p className="text-sm text-muted-foreground mt-1">
            只读追溯插件采集、公开 API、规则计算与 Excel fallback 形成的计算输入版本；不提供上传、解析或发布 current。
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => toast.info("Excel fallback 仅用于异常补录，不作为主链路")}
        >
          <FileWarning className="h-3.5 w-3.5 mr-1.5" /> 异常补录 / Excel fallback
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 min-w-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="已发布版本" value={String(mockDataVersions.filter((v) => v.status === "published").length)} />
            <SummaryCard label="有缺口版本" value={String(mockDataVersions.filter((v) => v.status === "warning").length)} tone="warning" />
            <SummaryCard label="Excel fallback" value={String(mockDataVersions.filter((v) => v.source === "Excel fallback").length)} />
            <SummaryCard label="默认测算版本" value="DV-SETTLE-202604-V1" compact />
          </div>

          <div className="p-4 rounded-lg shadow-notion bg-card">
            <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-7 gap-3 items-end">
              <div>
                <Label className="text-xs text-muted-foreground">数据类型</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {dataTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">状态</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {Object.entries(dataVersionStatusLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">来源</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {sources.map((source) => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">产物类型</Label>
                <Select value={artifactFilter} onValueChange={setArtifactFilter}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {artifactTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">结算月</Label>
                <Input className="h-9 mt-1" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">版本 / 任务 / objectKey</Label>
                <Input className="h-9 mt-1" placeholder="支持模糊查询" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              </div>
              <Button size="sm" className="h-9">
                <Search className="h-3.5 w-3.5 mr-1.5" /> 查询
              </Button>
            </div>
          </div>

          <div className="rounded-lg shadow-notion bg-card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-sm">
              <thead>
                <tr className="border-b bg-secondary/50 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">版本号</th>
                  <th className="text-left px-4 py-2.5 font-medium">数据类型</th>
                  <th className="text-left px-4 py-2.5 font-medium">结算月</th>
                  <th className="text-left px-4 py-2.5 font-medium">业务日期</th>
                  <th className="text-left px-4 py-2.5 font-medium">来源</th>
                  <th className="text-left px-4 py-2.5 font-medium">产物类型</th>
                  <th className="text-left px-4 py-2.5 font-medium">插件任务项ID</th>
                  <th className="text-left px-4 py-2.5 font-medium">objectKey</th>
                  <th className="text-left px-4 py-2.5 font-medium">pluginVersion</th>
                  <th className="text-left px-4 py-2.5 font-medium">覆盖率</th>
                  <th className="text-left px-4 py-2.5 font-medium">状态</th>
                  <th className="text-right px-4 py-2.5 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b last:border-b-0 hover:bg-secondary/30">
                    <td className="px-4 py-2.5 font-medium">{v.id}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{v.dataType}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{v.settleMonth}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{v.businessDate}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {v.source}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{v.artifactType}</td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{v.pluginTaskId}</td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-[11px] max-w-[220px] truncate">{v.objectKey}</td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{v.pluginVersion}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{v.coverage}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={statusStyle(v.status)}>
                        {dataVersionStatusLabel[v.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-2 text-xs">
                        <button className="text-primary hover:underline" onClick={() => selectDetail(v, "overview")}>月度概览</button>
                        <button className="text-primary hover:underline" onClick={() => selectDetail(v, "validation")}>校验结果</button>
                        <button className="text-primary hover:underline" onClick={() => selectDetail(v, "trace")}>来源追溯</button>
                        <button className="text-destructive hover:underline" onClick={() => toast.success(`${v.id} 作废确认弹窗（mock）`)}>作废</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        <aside className="rounded-lg shadow-notion bg-card p-4 h-fit sticky top-16">
          <div className="flex items-center gap-2 mb-3">
            <DatabaseZap className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">版本追溯</h2>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-md bg-secondary/40 p-1">
            {[
              ["overview", "月度概览"],
              ["validation", "校验结果"],
              ["trace", "来源追溯"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setDetailTab(key as DetailTab)}
                className={`h-7 rounded text-[11px] ${detailTab === key ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-3 text-sm">
            <TraceRow label="版本号" value={selected.id} mono />
            <TraceRow label="数据类型" value={selected.dataType} />
            <TraceRow label="来源类型" value={selected.source} />
            <TraceRow label="产物类型" value={selected.artifactType} />
            <TraceRow label="插件任务项ID" value={selected.pluginTaskId} mono />
            <TraceRow label="覆盖率" value={selected.coverage} />
            <TraceRow label="发布时间" value={selected.publishedAt} mono />
            {detailTab === "overview" && (
              <div className="rounded-md border bg-background p-3 space-y-2">
                <p className="text-xs text-muted-foreground">月度概览</p>
                <TraceRow label="应采" value={String(selected.monthlyOverview.expected)} />
                <TraceRow label="已有" value={String(selected.monthlyOverview.existing)} />
                <TraceRow label="缺失" value={String(selected.monthlyOverview.missing)} />
                <TraceRow label="未到期" value={String(selected.monthlyOverview.notDue)} />
                <TraceRow label="覆盖率" value={selected.monthlyOverview.coverageRate} />
                <TraceRow label="最近更新时间" value={selected.monthlyOverview.latestUpdatedAt} mono />
              </div>
            )}
            {detailTab === "validation" && (
              <div className="rounded-md border bg-background p-3 space-y-3">
                <p className="text-xs text-muted-foreground">校验结果</p>
                <TraceRow label="校验状态" value={selected.validation.status} />
                <TraceRow label="错误数" value={String(selected.validation.errorCount)} />
                <TraceRow label="警告数" value={String(selected.validation.warningCount)} />
                <SampleList title="字段级错误样例" items={selected.validation.fieldSamples} />
                <SampleList title="规则级警告样例" items={selected.validation.ruleSamples} />
              </div>
            )}
            {detailTab === "trace" && (
              <div className="rounded-md border bg-background p-3 space-y-2">
                <p className="text-xs text-muted-foreground">来源追溯</p>
                <TraceRow label="objectKey" value={selected.objectKey} mono />
                <TraceRow label="pluginVersion" value={selected.pluginVersion} mono />
                <TraceRow label="sourceFileId" value={selected.sourceFileId} mono />
                <TraceRow label="importBatchId" value={selected.importBatchId} mono />
                <TraceRow label="来源文件名" value={selected.sourceFileName} />
                <TraceRow label="采集时间" value={selected.capturedAt} mono />
                <div className="rounded-md border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground mb-1">说明</p>
                  <p className="text-sm leading-relaxed">{selected.traceNote}</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone, compact }: { label: string; value: string; tone?: "warning"; compact?: boolean }) {
  return (
    <div className="p-3 rounded-lg shadow-notion bg-card">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono font-semibold ${compact ? "text-sm" : "text-xl"} ${tone === "warning" ? "text-warning" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function TraceRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-2 last:border-b-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function SampleList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item} className="rounded bg-secondary/40 px-2 py-1 text-xs text-muted-foreground">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
