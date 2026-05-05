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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Search, Download, Plus } from "lucide-react";
import {
  mockCustomers,
  mockPackageVersions,
  Customer,
  PackageVersion,
} from "@/lib/calculatorMocks";
import { toast } from "sonner";

type CustomerDemoState = "normal" | "empty" | "noResult" | "noPackage" | "conflict" | "saveFailed" | "permissionDenied";

const customerDemoOptions: Array<{ value: CustomerDemoState; label: string; hint: string }> = [
  { value: "normal", label: "正常客户池", hint: "展示当月有效客户和套餐版本。" },
  { value: "empty", label: "首次无客户", hint: "用于演示系统首次进入时没有客户档案。" },
  { value: "noResult", label: "筛选无结果", hint: "用于演示查询条件过窄时的空态。" },
  { value: "noPackage", label: "当月无有效套餐", hint: "用于演示客户存在但结算月未命中有效套餐。" },
  { value: "conflict", label: "套餐区间冲突", hint: "用于演示两个套餐版本生效区间重叠。" },
  { value: "saveFailed", label: "保存失败", hint: "用于演示版本编辑保存失败。" },
  { value: "permissionDenied", label: "权限不足", hint: "用于演示无权启停套餐版本。" },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    published: "bg-success/10 text-success border-success/30",
    disabled: "bg-muted text-muted-foreground border-border",
    draft: "bg-warning/10 text-warning border-warning/30",
  };
  return map[status] ?? "bg-secondary text-foreground";
};

export default function CustomersPage() {
  const [settleMonth, setSettleMonth] = useState("2026-04");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [demoState, setDemoState] = useState<CustomerDemoState>("normal");

  const filtered = useMemo(() => {
    if (demoState === "empty" || demoState === "noResult") return [];
    return mockCustomers.filter((c) => {
      if (demoState !== "noPackage" && !showInactive && c.status !== "active") return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (packageFilter !== "all" && !c.packageStructure.includes(packageFilter))
        return false;
      if (keyword && !c.name.includes(keyword)) return false;
      return true;
    });
  }, [keyword, statusFilter, packageFilter, showInactive, demoState]);

  const versions: PackageVersion[] = selected
    ? mockPackageVersions.filter((v) => v.customerId === selected.id)
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页头 */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold">客户与套餐</h1>
            <p className="text-sm text-muted-foreground mt-1">
              以结算月命中的有效套餐为主视角，统一承接客户查询、套餐版本查看和版本动作。
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("已导出客户列表")}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> 导出列表
            </Button>
            <Button size="sm" onClick={() => toast.info("新增客户表单（演示）")}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> 新增客户
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-lg border bg-card p-3 shadow-notion">
        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] items-center">
          <div>
            <Label className="text-xs text-muted-foreground">演示状态</Label>
            <Select value={demoState} onValueChange={(v) => setDemoState(v as CustomerDemoState)}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {customerDemoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            {customerDemoOptions.find((option) => option.value === demoState)?.hint}
            <div className="mt-2 flex flex-wrap gap-1">
              {customerDemoOptions.map((option) => (
                <span key={option.value} className="rounded bg-background px-1.5 py-0.5">
                  {option.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 筛选区 */}
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
            <Label className="text-xs text-muted-foreground">客户名称</Label>
            <Input
              className="h-9 mt-1"
              placeholder="支持模糊查询"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">客户状态</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="active">启用</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">套餐类型</Label>
            <Select value={packageFilter} onValueChange={setPackageFilter}>
              <SelectTrigger className="h-9 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="固定价">固定价</SelectItem>
                <SelectItem value="市场均价">市场均价</SelectItem>
                <SelectItem value="分成">含分成</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-9">
              <Search className="h-3.5 w-3.5 mr-1.5" /> 查询
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setShowInactive((v) => !v)}
            >
              {showInactive ? "隐藏" : "显示"}无有效套餐客户
            </Button>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="rounded-lg shadow-notion bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50">
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">客户名称</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">客户编码</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">交易市场</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">售电公司</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">项目公司</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">当前生效套餐</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">套餐结构</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">K1/K2/K3</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">生效开始</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">生效结束</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">状态</th>
              <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-b-0 hover:bg-secondary/30">
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.tradingMarket}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.retailer}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.projectCompany}</td>
                  <td className="px-4 py-2.5">{demoState === "noPackage" ? "无有效套餐" : c.currentPackage}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.packageStructure}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.k1k2k3}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.effectiveStart}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.effectiveEnd ?? "--"}</td>
                <td className="px-4 py-2.5">
                  <Badge
                    variant="outline"
                    className={
                      c.status === "active"
                        ? "bg-success/10 text-success border-success/30"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {c.status === "active" ? "启用" : "停用"}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary"
                    onClick={() => setSelected(c)}
                  >
                    查看套餐版本
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {demoState === "empty" ? "首次进入暂无客户，可点击新增客户录入首批客户档案。" : "当前筛选条件下没有匹配客户，请调整结算月、状态或关键词。"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 套餐版本时间线抽屉 */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[620px] sm:max-w-[620px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>套餐版本时间线</SheetTitle>
            <SheetDescription>{selected?.name} / {selected?.code} / {selected?.tradingMarket} / {settleMonth}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="mt-2 mb-4 text-xs text-muted-foreground">
              {selected.retailer} / {selected.projectCompany} / {selected.orderName}
            </div>
          )}
          {demoState !== "normal" && (
            <div className="mb-4 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
              {customerDemoOptions.find((option) => option.value === demoState)?.hint}
            </div>
          )}
          <div className="space-y-3">
            {versions.map((v) => (
              <div key={v.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{v.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{v.description}</p>
                  </div>
                  <Badge variant="outline" className={statusBadge(v.status)}>
                    {v.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{v.formula}</p>
                <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                  <KV k="套餐结构" v={selected?.packageStructure ?? "--"} />
                  <KV k="K1/K2/K3" v={selected?.k1k2k3 ?? "--"} />
                  <KV k="K分成" v={selected?.packageStructure.includes("分成") ? "18%" : "0%"} />
                  <KV k="K浮动" v={selected?.packageStructure.includes("浮动") ? "P售均+8 元/MWh" : "不适用"} />
                  <KV k="生效开始" v={selected?.effectiveStart ?? "--"} />
                  <KV k="生效结束" v={selected?.effectiveEnd ?? "长期"} />
                </div>
                <div className="mb-3 rounded-md border bg-background p-2">
                  <p className="mb-2 text-xs font-medium">小时价格参数（压缩展示）</p>
                  <div className="grid grid-cols-4 gap-1 text-[11px] text-muted-foreground">
                    {["00:00", "06:00", "12:00", "18:00"].map((hour, index) => (
                      <div key={hour} className="rounded bg-secondary/40 p-2">
                        <p className="font-mono">{hour}</p>
                        <p>固定价 {428 + index * 6}</p>
                        <p>基准价 {390 + index * 8}</p>
                        <p>浮动价 +{index * 3 + 2}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toast.info("新增版本表单（mock）")}
                  >
                    新增版本
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toast.success(`已复制 ${v.name}`)}
                  >
                    复制
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toast.info(demoState === "saveFailed" ? "保存失败：版本字段校验未通过" : "编辑草稿（mock）")}
                  >
                    编辑草稿
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toast.info(demoState === "permissionDenied" ? "权限不足：当前账号不能启用版本" : "启用版本确认弹窗（mock）")}
                  >
                    启用
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive"
                    disabled={v.status === "disabled"}
                    onClick={() => toast.info(demoState === "permissionDenied" ? "权限不足：当前账号不能停用版本" : `停用 ${v.name} 确认弹窗（mock）`)}
                  >
                    停用
                  </Button>
                </div>
              </div>
            ))}
            {versions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">暂无版本</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded bg-secondary/40 px-2 py-1">
      <span className="text-muted-foreground">{k}：</span>
      <span>{v}</span>
    </div>
  );
}
