import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import {
  mockCalcRuns,
  mockWholesaleRows,
  mockCustomerSettleRows,
  mockProfitAnalysisRows,
  runStatusLabel,
  runTypeLabel,
} from "@/lib/calculatorMocks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tab = "wholesale" | "customer" | "profit";
type ResultDemoState = "normal" | "running" | "failed" | "emptyTab" | "exportFail" | "voidedInput";

const resultDemoOptions: Array<{ value: ResultDemoState; label: string; hint: string }> = [
  { value: "normal", label: "正常结果", hint: "冻结结果可查看，可按 Tab 导出。" },
  { value: "running", label: "任务运行中", hint: "任务尚未完成，结果不可查看。" },
  { value: "failed", label: "任务失败", hint: "只展示失败原因和输入追溯，不展示结果明细。" },
  { value: "emptyTab", label: "某 Tab 无明细", hint: "用于演示结果冻结但局部明细缺失。" },
  { value: "exportFail", label: "导出失败", hint: "用于演示导出服务失败 toast。" },
  { value: "voidedInput", label: "输入版本已作废", hint: "结果可查看，但顶部展示作废风险提示。" },
];

const tabs: { key: Tab; label: string }[] = [
  { key: "wholesale", label: "批发侧结果" },
  { key: "customer", label: "客户结算" },
  { key: "profit", label: "收益分析" },
];

export default function RunResultPage() {
  const nav = useNavigate();
  const { runId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) || "wholesale";
  const [customerKeyword, setCustomerKeyword] = useState("");
  const [metricType, setMetricType] = useState("all");
  const [demoState, setDemoState] = useState<ResultDemoState>("normal");
  const [detailCustomer, setDetailCustomer] = useState<string | null>(null);

  const run = useMemo(
    () => mockCalcRuns.find((r) => r.id === runId) ?? mockCalcRuns[1],
    [runId]
  );

  const setTab = (t: Tab) => {
    searchParams.set("tab", t);
    setSearchParams(searchParams);
  };

  const currentDemo = resultDemoOptions.find((option) => option.value === demoState) ?? resultDemoOptions[0];
  const blocked = demoState === "running" || demoState === "failed";
  const customerRows = demoState === "emptyTab" && tab === "customer" ? [] : mockCustomerSettleRows.filter((r) => !customerKeyword || r.customerName.includes(customerKeyword));
  const profitRows = demoState === "emptyTab" && tab === "profit" ? [] : mockProfitAnalysisRows.filter((r) => !customerKeyword || r.customerName.includes(customerKeyword));
  const wholesaleRows = demoState === "emptyTab" && tab === "wholesale" ? [] : mockWholesaleRows;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页头 */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">结果详情</h1>
          <p className="text-sm text-muted-foreground mt-1">
            统一承载单个 calc_run 的结果查看，通过批发侧结果、客户结算、收益分析三类视图切换。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => nav("/tools/calculator/runs")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> 返回任务页
          </Button>
          <Button variant="outline" size="sm" onClick={() => demoState === "exportFail" ? toast.error("导出失败：结果文件服务不可用（mock）") : toast.success("已导出当前 Tab")}>
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> 导出当前 Tab
          </Button>
          <Button size="sm" onClick={() => demoState === "exportFail" ? toast.error("导出失败：整批结果生成超时（mock）") : toast.success("已导出整批次结果")}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> 导出整批次结果
          </Button>
        </div>
      </div>

      <div className="mb-4 rounded-lg border bg-card p-3 shadow-notion">
        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] items-center">
          <div>
            <Label className="text-xs text-muted-foreground">演示状态</Label>
            <Select value={demoState} onValueChange={(v) => setDemoState(v as ResultDemoState)}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {resultDemoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={`rounded-md px-3 py-2 text-xs ${demoState === "normal" ? "bg-secondary/40 text-muted-foreground" : demoState === "failed" || demoState === "voidedInput" ? "border border-destructive/30 bg-destructive/5 text-destructive" : "border border-warning/30 bg-warning/5 text-warning"}`}>
            {currentDemo.hint}
            <div className="mt-2 flex flex-wrap gap-1">
              {resultDemoOptions.map((option) => (
                <span key={option.value} className="rounded bg-background px-1.5 py-0.5 text-muted-foreground">
                  {option.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {blocked && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">{demoState === "running" ? "任务运行中，结果不可查看" : "任务失败，只展示失败原因"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {demoState === "running" ? "当前 calcRunId 仍在 mock 队列中，结果冻结前不允许导出或查看明细。" : "失败原因：批发侧成本计算缺少价格版本 DV-PRICE-20260421-MISS；请回到数据版本页补齐。"}
          </p>
        </div>
      )}

      {demoState === "voidedInput" && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          输入版本已作废风险提示：{run.dataVersionId} 已被新版本替代，本结果仅可用于历史追溯，不建议作为正式口径。
        </div>
      )}

      {/* KPI 卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="任务编号" value={run.id} />
        <KpiCard label="客户数" value={String(run.customerCount)} />
        <KpiCard label="总成本(元)" value={run.totalCost.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} />
        <KpiCard label="总毛利(元)" value={run.totalProfit.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} />
      </div>

      {/* 任务元信息 */}
      <div className="p-3 rounded-lg shadow-notion bg-card mb-4 flex items-start justify-between gap-3">
        <div className="grid gap-1.5 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{runTypeLabel[run.type]}</span>
            <span className="text-muted-foreground">{run.settleMonth}</span>
            <span className="text-muted-foreground">/ {run.policyVersion}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span className="font-mono">数据版本 {run.dataVersionId}</span>
            <span className="font-mono">套餐快照 {run.packageSnapshot}</span>
            <span>{run.validationSummary}</span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            run.status === "success"
              ? "bg-success/10 text-success border-success/30"
              : "bg-destructive/10 text-destructive border-destructive/30"
          }
        >
          {runStatusLabel[run.status]}
        </Badge>
      </div>

      {blocked ? null : (
        <>

      {/* 筛选区 */}
      <div className="p-4 rounded-lg shadow-notion bg-card mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <Label className="text-xs text-muted-foreground">客户名称</Label>
          <Input
            className="h-9 mt-1"
            placeholder="仅对客户结算/收益分析生效"
            value={customerKeyword}
            onChange={(e) => setCustomerKeyword(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">指标类型</Label>
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="base">基础结算</SelectItem>
              <SelectItem value="share">分成</SelectItem>
              <SelectItem value="recovery">回收</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="rounded-lg shadow-notion bg-card overflow-hidden">
        <div className="flex border-b">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-4 py-3 text-sm border-b-2 transition-colors",
                tab === t.key
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "wholesale" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">时段</th>
                <th className="text-right px-4 py-2.5 font-medium">R1 金额</th>
                <th className="text-right px-4 py-2.5 font-medium">回收金额</th>
                <th className="text-right px-4 py-2.5 font-medium">公司成本</th>
              </tr>
            </thead>
            <tbody>
              {wholesaleRows.map((r, i) => (
                <tr key={i} className="border-b last:border-b-0 hover:bg-secondary/30">
                  <td className="px-4 py-2.5">{r.period}</td>
                  <td className="px-4 py-2.5 text-right">{r.r1Amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-right">{r.recoveryAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{r.companyCost.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {wholesaleRows.length === 0 && <EmptyRow colSpan={4} />}
            </tbody>
          </table>
        )}

        {tab === "customer" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">客户名称</th>
                <th className="text-left px-4 py-2.5 font-medium">套餐类型</th>
                <th className="text-right px-4 py-2.5 font-medium">电量(MWh)</th>
                <th className="text-right px-4 py-2.5 font-medium">收入(元)</th>
                <th className="text-right px-4 py-2.5 font-medium">成本(元)</th>
                <th className="text-right px-4 py-2.5 font-medium">毛利(元)</th>
                <th className="text-right px-4 py-2.5 font-medium">均价(元/MWh)</th>
                <th className="text-right px-4 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {customerRows.map((r, i) => (
                  <tr key={i} className="border-b last:border-b-0 hover:bg-secondary/30">
                    <td className="px-4 py-2.5 font-medium">{r.customerName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.packageType}</td>
                    <td className="px-4 py-2.5 text-right">{r.volumeMWh.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right">{r.revenue.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right">{r.cost.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-success">{r.profit.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{r.avgPrice.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button className="text-xs text-primary hover:underline" onClick={() => setDetailCustomer(r.customerName)}>客户明细</button>
                    </td>
                  </tr>
                ))}
              {customerRows.length === 0 && <EmptyRow colSpan={8} />}
            </tbody>
          </table>
        )}

        {tab === "profit" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">客户名称</th>
                <th className="text-right px-4 py-2.5 font-medium">基础毛利(元)</th>
                <th className="text-right px-4 py-2.5 font-medium">分成毛利(元)</th>
                <th className="text-right px-4 py-2.5 font-medium">回收毛利(元)</th>
                <th className="text-right px-4 py-2.5 font-medium">合计(元)</th>
              </tr>
            </thead>
            <tbody>
              {profitRows.map((r, i) => (
                  <tr key={i} className="border-b last:border-b-0 hover:bg-secondary/30">
                    <td className="px-4 py-2.5 font-medium">{r.customerName}</td>
                    <td className="px-4 py-2.5 text-right">{r.baseProfit.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right">{r.shareProfit.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right">{r.recoveryProfit.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-success">{r.total.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              {profitRows.length === 0 && <EmptyRow colSpan={5} />}
            </tbody>
          </table>
        )}
      </div>
        </>
      )}

      <Sheet open={!!detailCustomer} onOpenChange={(open) => !open && setDetailCustomer(null)}>
        <SheetContent className="w-[560px] sm:max-w-[560px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>客户逐时明细</SheetTitle>
          </SheetHeader>
          <div className="mt-4 rounded-md border bg-secondary/20 p-3 text-sm">
            <p className="font-medium">{detailCustomer}</p>
            <p className="mt-1 text-xs text-muted-foreground">逐时电量、逐时结算价、逐时电费均为 mock，用于确认抽屉形态。</p>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30 text-xs text-muted-foreground">
                <th className="text-left px-3 py-2">小时</th>
                <th className="text-right px-3 py-2">电量(MWh)</th>
                <th className="text-right px-3 py-2">结算价</th>
                <th className="text-right px-3 py-2">电费</th>
              </tr>
            </thead>
            <tbody>
              {["00:00", "06:00", "12:00", "18:00"].map((hour, index) => (
                <tr key={hour} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono">{hour}</td>
                  <td className="px-3 py-2 text-right">{(42.6 + index * 8.4).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{(338 + index * 6).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{((42.6 + index * 8.4) * (338 + index * 6)).toLocaleString("zh-CN", { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg shadow-notion bg-card">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted-foreground">
        当前 Tab 暂无明细，用于演示“某 Tab 无明细”状态。
      </td>
    </tr>
  );
}
