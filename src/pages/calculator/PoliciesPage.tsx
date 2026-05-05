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
import { Plus, Search } from "lucide-react";
import { mockPolicyVersions, PolicyVersion } from "@/lib/calculatorMocks";
import { toast } from "sonner";

type PolicyDemoState = "normal" | "noActive" | "draftIncomplete" | "missingParam" | "enableConfirm" | "disableConfirm";

const policyDemoOptions: Array<{ value: PolicyDemoState; label: string; hint: string }> = [
  { value: "normal", label: "正常参数版本", hint: "存在 active 版本，可供测算任务选择。" },
  { value: "noActive", label: "无 active 版本", hint: "当前结算月没有启用版本，正式测算应阻断。" },
  { value: "draftIncomplete", label: "草稿未完整", hint: "草稿缺少必填参数，只允许保存草稿。" },
  { value: "missingParam", label: "参数缺失", hint: "小时或月度参数缺失，测算前必须补齐。" },
  { value: "enableConfirm", label: "启用确认", hint: "启用版本前展示影响范围和确认提示。" },
  { value: "disableConfirm", label: "停用确认", hint: "停用 active 版本前提醒会影响新建测算。" },
];

const statusBadge = (s: string) => {
  switch (s) {
    case "active":
      return "bg-success/10 text-success border-success/30";
    case "draft":
      return "bg-warning/10 text-warning border-warning/30";
    case "disabled":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary text-foreground";
  }
};

export default function PoliciesPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [month, setMonth] = useState("2026-04");
  const [selected, setSelected] = useState<PolicyVersion | null>(null);
  const [demoState, setDemoState] = useState<PolicyDemoState>("normal");

  const filtered = useMemo(() => {
    return mockPolicyVersions.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (month && !p.effectiveMonth.includes(month) && p.effectiveMonth !== month) return false;
      if (keyword && !p.name.includes(keyword) && !p.code.includes(keyword)) return false;
      return true;
    });
  }, [keyword, status, month]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">政策参数版本</h1>
          <p className="text-sm text-muted-foreground mt-1">
            仅做版本级管理，不在页面中编辑计算公式本身；支持详情查看、复制、启停。
          </p>
        </div>
        <Button size="sm" onClick={() => toast.info("新建版本表单（演示）")}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> 新建版本
        </Button>
      </div>

      <div className="mb-4 rounded-lg border bg-card p-3 shadow-notion">
        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] items-center">
          <div>
            <Label className="text-xs text-muted-foreground">演示状态</Label>
            <Select value={demoState} onValueChange={(v) => setDemoState(v as PolicyDemoState)}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {policyDemoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={`rounded-md px-3 py-2 text-xs ${demoState === "normal" ? "bg-secondary/40 text-muted-foreground" : "bg-warning/5 text-warning border border-warning/30"}`}>
            {policyDemoOptions.find((option) => option.value === demoState)?.hint}
            <div className="mt-2 flex flex-wrap gap-1">
              {policyDemoOptions.map((option) => (
                <span key={option.value} className="rounded bg-background px-1.5 py-0.5 text-muted-foreground">
                  {option.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg shadow-notion bg-card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-xs text-muted-foreground">版本名称</Label>
            <Input
              className="h-9 mt-1"
              placeholder="支持模糊查询"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">状态</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="draft">draft</SelectItem>
                <SelectItem value="disabled">disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">生效月份</Label>
            <Input
              className="h-9 mt-1"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <Button size="sm" className="h-9">
            <Search className="h-3.5 w-3.5 mr-1.5" /> 查询
          </Button>
        </div>
      </div>

      <div className="rounded-lg shadow-notion bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-xs text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-medium">版本名称</th>
              <th className="text-left px-4 py-2.5 font-medium">版本编号</th>
              <th className="text-left px-4 py-2.5 font-medium">生效月份</th>
              <th className="text-left px-4 py-2.5 font-medium">状态</th>
              <th className="text-left px-4 py-2.5 font-medium">更新时间</th>
              <th className="text-right px-4 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b last:border-b-0 hover:bg-secondary/30">
                <td className="px-4 py-2.5 font-medium">{p.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.code}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.effectiveMonth}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className={statusBadge(p.status)}>
                    {p.status}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.updatedAt}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-2 text-xs">
                    <button className="text-primary hover:underline" onClick={() => setSelected(p)}>查看详情</button>
                    <button className="text-foreground/70 hover:text-foreground" onClick={() => toast.info("编辑草稿表单（mock）")}>编辑草稿</button>
                    <button className="text-foreground/70 hover:text-foreground" onClick={() => toast.success(`已复制 ${p.name}`)}>复制</button>
                    <button className="text-primary hover:underline" onClick={() => toast.info(demoState === "enableConfirm" ? "启用确认：将成为本月 active 政策版本" : "启用版本确认弹窗（mock）")}>启用</button>
                    <button className="text-destructive hover:underline" onClick={() => toast.info(demoState === "disableConfirm" ? "停用确认：新建测算将无法选择该版本" : "停用版本确认弹窗（mock）")}>停用</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 详情抽屉 */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[560px] sm:max-w-[560px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle>政策参数版本详情</SheetTitle>
                    <SheetDescription className="mt-1">
                      {selected.code} / {selected.effectiveMonth}
                    </SheetDescription>
                  </div>
                  <Badge variant="outline" className={statusBadge(selected.status)}>
                    {selected.status}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {demoState !== "normal" && (
                  <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
                    {policyDemoOptions.find((option) => option.value === demoState)?.hint}
                  </div>
                )}
                <Section title="基本信息">
                  <KV k="版本名称" v={selected.name} />
                  <KV k="版本编号" v={selected.code} />
                  <KV k="生效月份" v={selected.effectiveMonth} />
                  <KV k="状态" v={demoState === "noActive" && selected.status === "active" ? "待启用（mock）" : selected.status} />
                  <KV k="版本说明" v={selected.description} />
                  <KV k="数据来源" v={selected.dataSource} />
                  <KV k="备注" v={demoState === "draftIncomplete" ? "草稿未完整：缺少小时参数 H17-H20" : "原型参数版本"} />
                </Section>

                <Section title="恒定参数">
                  <div className="grid grid-cols-2 gap-2">
                    {selected.constants.map((c) => (
                      <KV key={c.key} k={c.key} v={c.value} />
                    ))}
                  </div>
                </Section>

                <Section title="月度参数">
                  {selected.monthly.map((c) => (
                    <KV key={c.key} k={c.key} v={c.value} />
                  ))}
                  {demoState === "missingParam" && <KV k="missing_monthly_param" v="缺失，阻断正式测算" />}
                </Section>

                <Section title="小时参数">
                  {selected.hourly.map((c) => (
                    <KV key={c.key} k={c.key} v={c.value} />
                  ))}
                  {demoState === "missingParam" && <KV k="H17-H20" v="缺失，需补齐后启用" />}
                </Section>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success(`已复制 ${selected.name}`)}
                  >
                    复制此版本
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info(demoState === "enableConfirm" ? "启用确认：将停用同月其他 active 版本" : "启用版本确认弹窗（mock）")}
                  >
                    启用
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("编辑草稿（mock）")}
                  >
                    编辑草稿
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    disabled={selected.status === "disabled"}
                    onClick={() => toast.success(`${selected.name} 已停用`)}
                  >
                    停用
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card/50 p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-secondary/40">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
