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

  const filtered = useMemo(() => {
    return mockCustomers.filter((c) => {
      if (!showInactive && c.status !== "active") return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (packageFilter !== "all" && !c.packageStructure.includes(packageFilter))
        return false;
      if (keyword && !c.name.includes(keyword)) return false;
      return true;
    });
  }, [keyword, statusFilter, packageFilter, showInactive]);

  const versions: PackageVersion[] = selected
    ? mockPackageVersions.filter((v) => v.customerId === selected.id)
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页头 */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold">客户列表</h1>
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
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">售电公司</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">订单名称</th>
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
                <td className="px-4 py-2.5 text-muted-foreground">{c.retailer}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.orderName}</td>
                <td className="px-4 py-2.5">{c.currentPackage}</td>
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
          </tbody>
        </table>
      </div>

      {/* 套餐版本时间线抽屉 */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px]">
          <SheetHeader>
            <SheetTitle>套餐版本时间线</SheetTitle>
            <SheetDescription>{selected?.name}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="mt-2 mb-4 text-xs text-muted-foreground">
              {selected.retailer} / {selected.orderName}
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
                <div className="flex gap-2">
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
                    className="h-7 text-xs text-destructive"
                    disabled={v.status === "disabled"}
                    onClick={() => toast.success(`已停用 ${v.name}`)}
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
