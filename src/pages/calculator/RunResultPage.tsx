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

  const run = useMemo(
    () => mockCalcRuns.find((r) => r.id === runId) ?? mockCalcRuns[1],
    [runId]
  );

  const setTab = (t: Tab) => {
    searchParams.set("tab", t);
    setSearchParams(searchParams);
  };

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
          <Button variant="outline" size="sm" onClick={() => toast.success("已导出当前 Tab")}>
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> 导出当前 Tab
          </Button>
          <Button size="sm" onClick={() => toast.success("已导出整批次结果")}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> 导出整批次结果
          </Button>
        </div>
      </div>

      {/* KPI 卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="任务编号" value={run.id} />
        <KpiCard label="客户数" value={String(run.customerCount)} />
        <KpiCard label="总成本(元)" value={run.totalCost.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} />
        <KpiCard label="总毛利(元)" value={run.totalProfit.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} />
      </div>

      {/* 任务元信息 */}
      <div className="p-3 rounded-lg shadow-notion bg-card mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{runTypeLabel[run.type]}</span>
          <span className="text-muted-foreground">{run.settleMonth}</span>
          <span className="text-muted-foreground">/ {run.policyVersion}</span>
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
              {mockWholesaleRows.map((r, i) => (
                <tr key={i} className="border-b last:border-b-0 hover:bg-secondary/30">
                  <td className="px-4 py-2.5">{r.period}</td>
                  <td className="px-4 py-2.5 text-right">{r.r1Amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-right">{r.recoveryAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{r.companyCost.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
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
              </tr>
            </thead>
            <tbody>
              {mockCustomerSettleRows
                .filter((r) => !customerKeyword || r.customerName.includes(customerKeyword))
                .map((r, i) => (
                  <tr key={i} className="border-b last:border-b-0 hover:bg-secondary/30">
                    <td className="px-4 py-2.5 font-medium">{r.customerName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.packageType}</td>
                    <td className="px-4 py-2.5 text-right">{r.volumeMWh.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right">{r.revenue.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right">{r.cost.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-success">{r.profit.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{r.avgPrice.toFixed(2)}</td>
                  </tr>
                ))}
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
              {mockProfitAnalysisRows
                .filter((r) => !customerKeyword || r.customerName.includes(customerKeyword))
                .map((r, i) => (
                  <tr key={i} className="border-b last:border-b-0 hover:bg-secondary/30">
                    <td className="px-4 py-2.5 font-medium">{r.customerName}</td>
                    <td className="px-4 py-2.5 text-right">{r.baseProfit.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right">{r.shareProfit.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right">{r.recoveryProfit.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-success">{r.total.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
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
