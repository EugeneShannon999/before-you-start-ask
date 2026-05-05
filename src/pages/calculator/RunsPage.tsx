import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Search, Plus, ShieldCheck } from "lucide-react";
import { mockCalcRuns, mockDataVersions, runStatusLabel, runTypeLabel } from "@/lib/calculatorMocks";
import { toast } from "sonner";

type RunDemoState = "normal" | "incompleteData" | "noPolicy" | "validationFailed" | "running" | "failed" | "warning" | "voidConfirm";

const runDemoOptions: Array<{ value: RunDemoState; label: string; hint: string; blocking?: boolean }> = [
  { value: "normal", label: "正常新建测算", hint: "输入数据版本、政策参数和套餐快照均可追溯。" },
  { value: "incompleteData", label: "输入数据版本不完整", hint: "月度结算数据缺 2 个客户，正式核算阻断。", blocking: true },
  { value: "noPolicy", label: "无可用政策参数版本", hint: "本月无 active 政策版本，不能开始正式测算。", blocking: true },
  { value: "validationFailed", label: "校验不通过", hint: "缺失日前/实时记录或套餐重叠，需先修正。", blocking: true },
  { value: "running", label: "测算运行中", hint: "任务已提交，结果尚未冻结。" },
  { value: "failed", label: "测算失败", hint: "计算服务返回失败原因，仅保留日志。" },
  { value: "warning", label: "成功但有警告", hint: "允许查看结果，但需提示输入缺口风险。" },
  { value: "voidConfirm", label: "作废确认", hint: "作废任务前展示影响范围和确认提示。" },
];

const statusStyle = (status: string) => {
  switch (status) {
    case "success":
      return "bg-success/10 text-success border-success/30";
    case "failed":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "running":
      return "bg-primary/10 text-primary border-primary/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function RunsPage() {
  const nav = useNavigate();
  const [settleMonth, setSettleMonth] = useState("2026-04");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [policyFilter, setPolicyFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [demoState, setDemoState] = useState<RunDemoState>("normal");

  const currentDemo = runDemoOptions.find((option) => option.value === demoState) ?? runDemoOptions[0];

  const filtered = useMemo(() => {
    return mockCalcRuns.filter((r) => {
      if (settleMonth && !r.settleMonth.includes(settleMonth.replace("-", "")) && r.settleMonth !== settleMonth)
        return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (policyFilter !== "all" && r.policyVersion !== policyFilter) return false;
      return true;
    });
  }, [settleMonth, statusFilter, typeFilter, policyFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">测算任务</h1>
          <p className="text-sm text-muted-foreground mt-1">
            将发起测算和历史记录合并到同一页面，支持校验、启动、状态追踪和结果跳转。
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> 新建测算
        </Button>
      </div>

      <div className="mb-4 rounded-lg border bg-card p-3 shadow-notion">
        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] items-center">
          <div>
            <Label className="text-xs text-muted-foreground">演示状态</Label>
            <Select value={demoState} onValueChange={(v) => setDemoState(v as RunDemoState)}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {runDemoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={`rounded-md px-3 py-2 text-xs ${currentDemo.blocking ? "border border-destructive/30 bg-destructive/5 text-destructive" : demoState === "normal" ? "bg-secondary/40 text-muted-foreground" : "border border-warning/30 bg-warning/5 text-warning"}`}>
            {currentDemo.hint}
            <div className="mt-2 flex flex-wrap gap-1">
              {runDemoOptions.map((option) => (
                <span key={option.value} className="rounded bg-background px-1.5 py-0.5 text-muted-foreground">
                  {option.label}
                </span>
              ))}
              <span className="rounded bg-background px-1.5 py-0.5 text-muted-foreground">抽屉按钮：仅校验 / 开始测算 / 保存草稿 / 取消</span>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="p-4 rounded-lg shadow-notion bg-card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <Label className="text-xs text-muted-foreground">结算月</Label>
            <Input
              className="h-9 mt-1"
              value={settleMonth}
              onChange={(e) => setSettleMonth(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">状态</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="success">成功</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
                <SelectItem value="running">运行中</SelectItem>
                <SelectItem value="pending">待校验</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">测算类型</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="trial">试算</SelectItem>
                <SelectItem value="formal">正式核算</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">政策版本</Label>
            <Select value={policyFilter} onValueChange={setPolicyFilter}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="POLICY-202604-TRIAL">POLICY-202604-TRIAL</SelectItem>
                <SelectItem value="POLICY-202604-DRAFT">POLICY-202604-DRAFT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="h-9">
            <Search className="h-3.5 w-3.5 mr-1.5" /> 查询
          </Button>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="rounded-lg shadow-notion bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-xs text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-medium">任务编号</th>
              <th className="text-left px-4 py-2.5 font-medium">结算月</th>
              <th className="text-left px-4 py-2.5 font-medium">类型</th>
              <th className="text-left px-4 py-2.5 font-medium">数据版本</th>
              <th className="text-left px-4 py-2.5 font-medium">政策版本</th>
              <th className="text-left px-4 py-2.5 font-medium">套餐快照</th>
              <th className="text-left px-4 py-2.5 font-medium">状态</th>
              <th className="text-right px-4 py-2.5 font-medium">客户数</th>
              <th className="text-right px-4 py-2.5 font-medium">总电量(MWh)</th>
              <th className="text-right px-4 py-2.5 font-medium">总成本(元)</th>
              <th className="text-right px-4 py-2.5 font-medium">总毛利(元)</th>
              <th className="text-right px-4 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b last:border-b-0 hover:bg-secondary/30">
                <td className="px-4 py-2.5 font-medium">{r.id}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.settleMonth}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{runTypeLabel[r.type]}</td>
                <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{r.dataVersionId}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.policyVersion}</td>
                <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{r.packageSnapshot}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className={statusStyle(r.status)}>
                    {runStatusLabel[r.status]}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right">{r.customerCount}</td>
                <td className="px-4 py-2.5 text-right">{r.totalVolumeMWh.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-2.5 text-right">{r.totalCost.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-2.5 text-right">{r.totalProfit.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-3 text-xs">
                    <button
                      className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                      disabled={r.status !== "success"}
                      onClick={() => nav(`/tools/calculator/runs/${r.id}/results`)}
                    >
                      查看结果
                    </button>
                    <button
                      className="text-foreground/70 hover:text-foreground"
                      onClick={() => toast.info(demoState === "running" ? `${r.id} 已进入运行中（mock）` : `已重新提交 ${r.id}`)}
                    >
                      重算
                    </button>
                    <button
                      className="text-destructive hover:underline"
                      onClick={() => toast.info(demoState === "voidConfirm" ? `${r.id} 作废确认：结果将不再作为正式口径` : `${r.id} 作废确认弹窗（mock）`)}
                    >
                      作废
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新建测算抽屉 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>新建测算任务</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-xs text-muted-foreground">结算月份</Label>
              <Input className="h-9 mt-1" defaultValue="2026-04" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">测算类型</Label>
              <Select defaultValue="trial">
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">试算</SelectItem>
                  <SelectItem value="formal">正式核算</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">客户范围</Label>
              <Select defaultValue="all">
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全量客户</SelectItem>
                  <SelectItem value="part">部分客户</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">数据版本</Label>
              <Select defaultValue="DV-SETTLE-202604-V1">
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mockDataVersions
                    .filter((v) => v.dataType === "月度结算数据")
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.id} / {v.coverage}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">政策版本</Label>
              <Select defaultValue="POLICY-202604-TRIAL">
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POLICY-202604-TRIAL">2026年4月试算参数 (active)</SelectItem>
                  <SelectItem value="POLICY-202604-DRAFT">2026年4月正式稿草稿 (draft)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">套餐版本口径</Label>
              <Select defaultValue="current">
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">当前生效版本</SelectItem>
                  <SelectItem value="snapshot">指定时刻快照</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border bg-success/5 border-success/20 p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className={`h-4 w-4 shrink-0 mt-0.5 ${currentDemo.blocking ? "text-destructive" : demoState === "warning" ? "text-warning" : "text-success"}`} />
                <div>
                  <p className={`text-sm font-medium ${currentDemo.blocking ? "text-destructive" : demoState === "warning" ? "text-warning" : "text-success"}`}>校验摘要</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {demoState === "normal" && "结算用户池 70 户；缺失套餐客户 0；缺失 P 售均小时数 0；缺失日前/实时记录数 0；套餐重叠数 0。默认数据版本 DV-SETTLE-202604-V1 已发布，覆盖率 96/96；政策版本与套餐快照均可追溯。"}
                    {demoState === "incompleteData" && "结算用户池 70 户；月度结算数据缺 2 户；缺失日前/实时记录数 0；正式核算阻断，仅允许保存草稿或试算。"}
                    {demoState === "noPolicy" && "结算用户池 70 户；数据版本完整；但无 active 政策参数版本，开始测算按钮禁用。"}
                    {demoState === "validationFailed" && "缺失套餐客户 3 户；缺失 P 售均小时数 12；缺失日前/实时记录数 8；套餐重叠数 2；校验不通过。"}
                    {demoState === "running" && "任务已提交到 mock 队列，状态为运行中，结果页暂不可查看。"}
                    {demoState === "failed" && "测算失败：批发侧成本计算缺少价格版本 DV-PRICE-20260421-MISS。"}
                    {demoState === "warning" && "测算成功但有警告：2 个客户使用 Excel fallback，结果页需要展示输入版本风险提示。"}
                    {demoState === "voidConfirm" && "作废确认：作废后该任务不能作为正式测算结果，只保留审计追溯。"}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">备注</Label>
              <Textarea className="mt-1" defaultValue="原型页面发起" rows={3} />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                if (currentDemo.blocking) toast.error("校验不通过，请先处理阻断项");
                else toast.success("校验通过");
              }}
            >
              仅校验
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.success("测算草稿已保存（mock）")}
            >
              保存草稿
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              disabled={currentDemo.blocking}
              onClick={() => {
                setOpen(false);
                toast.success(demoState === "warning" ? "已提交测算任务，结果将带警告标记" : "已提交测算任务");
              }}
            >
              开始测算
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
