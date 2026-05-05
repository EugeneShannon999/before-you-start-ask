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
          <h1 className="text-xl font-semibold">计算任务</h1>
          <p className="text-sm text-muted-foreground mt-1">
            将发起计算和历史记录合并到同一页面，支持校验、启动、状态追踪和结果跳转。
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> 新建任务
        </Button>
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
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">计算类型</Label>
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
                      onClick={() => toast.info(`已重新提交 ${r.id}`)}
                    >
                      重算
                    </button>
                    <button
                      className="text-destructive hover:underline"
                      onClick={() => toast.success(`${r.id} 已作废`)}
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

      {/* 新建任务抽屉 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>新建计算任务</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-xs text-muted-foreground">结算月份</Label>
              <Input className="h-9 mt-1" defaultValue="2026-04" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">计算类型</Label>
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
                <ShieldCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-success">校验摘要</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    默认数据版本 DV-SETTLE-202604-V1 已发布，覆盖率 96/96；政策版本与套餐快照均可追溯。若切换到有缺口版本，正式核算按钮应阻止提交。
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
                toast.success("校验通过");
              }}
            >
              仅校验
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                toast.success("已提交计算任务");
              }}
            >
              开始计算
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
