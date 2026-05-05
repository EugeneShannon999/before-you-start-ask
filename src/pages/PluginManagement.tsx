import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Download,
  RefreshCw,
  FileText,
  RotateCw,
  CircleCheck,
  CircleAlert,
  CircleX,
  CircleDashed,
  Bug,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

type SyncStatus = "ok" | "delay" | "fail" | "missing" | "syncing";
type SourceType = "公开API" | "页面抓取" | "规则计算" | "Excel fallback";
type DrawerMode = "log" | "debug" | null;

interface SyncRow {
  id: string;
  item: string;
  source: SourceType;
  lastSync: string;
  range: string;
  status: SyncStatus;
  coverage: string;
  dataVersion?: string;
  failReason?: string;
}

const initialSyncRows: SyncRow[] = [
  { id: "notice", item: "公告信息", source: "页面抓取", lastSync: "2026-04-30 10:32", range: "近 30 天", status: "ok", coverage: "128 条公告", dataVersion: "DV-NOTICE-20260430" },
  { id: "price", item: "日前/实时电价", source: "公开API", lastSync: "2026-04-30 10:30", range: "D-1 ~ D · 96 点", status: "ok", coverage: "96/96 时点", dataVersion: "DV-PRICE-202604-D" },
  { id: "load-fc", item: "负荷预测", source: "公开API", lastSync: "2026-04-30 10:30", range: "D 全日 96 点", status: "ok", coverage: "96/96 时点", dataVersion: "DV-LOAD-FC-20260430" },
  { id: "load-actual", item: "实际负荷", source: "公开API", lastSync: "2026-04-30 10:15", range: "D 截至 10:15", status: "delay", coverage: "41/96 时点", failReason: "接口披露延迟", dataVersion: "DV-LOAD-ACTUAL-20260430" },
  { id: "renewable", item: "新能源预测", source: "公开API", lastSync: "2026-04-30 10:30", range: "D 全日 96 点", status: "ok", coverage: "96/96 时点", dataVersion: "DV-REN-FC-20260430" },
  { id: "tie-line", item: "联络线计划", source: "公开API", lastSync: "2026-04-30 09:00", range: "D 全日", status: "ok", coverage: "24/24 小时", dataVersion: "DV-TIE-20260430" },
  { id: "must-run", item: "必开/必停机组", source: "页面抓取", lastSync: "2026-04-30 08:30", range: "D 全日", status: "ok", coverage: "6 台必开 / 2 台必停", dataVersion: "DV-THERMAL-MUST-20260430" },
  { id: "reserve", item: "正备用/负备用", source: "公开API", lastSync: "2026-04-30 10:30", range: "D 全日", status: "ok", coverage: "披露值 + D-1/月对比", dataVersion: "DV-RESERVE-20260430" },
  { id: "settlement", item: "月度结算数据", source: "页面抓取", lastSync: "2026-04-30 11:05", range: "2026-04 月度", status: "delay", coverage: "68/70 客户", failReason: "2 个客户等待 Excel fallback 补录", dataVersion: "DV-SETTLE-202604-V2" },
  { id: "contract", item: "中长期合约", source: "Excel fallback", lastSync: "待发布", range: "2026-04 月度", status: "missing", coverage: "168 条合约待校验", failReason: "受限页面暂未接入插件", dataVersion: "DV-CONTRACT-202604-FB" },
];

const statusMeta: Record<SyncStatus, { label: string; color: string; Icon: LucideIcon }> = {
  ok: { label: "正常", color: "text-success", Icon: CircleCheck },
  delay: { label: "延迟", color: "text-warning", Icon: CircleAlert },
  fail: { label: "失败", color: "text-destructive", Icon: CircleX },
  missing: { label: "未接入", color: "text-muted-foreground", Icon: CircleDashed },
  syncing: { label: "同步中", color: "text-primary", Icon: RotateCw },
};

export default function PluginManagement() {
  const [rows, setRows] = useState(initialSyncRows);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [activeRow, setActiveRow] = useState<SyncRow>(initialSyncRows[0]);
  const failRows = rows.filter((r) => r.status === "fail" || r.status === "delay" || r.status === "missing");
  const publishedVersions = rows.filter((r) => r.dataVersion && r.status !== "missing").length;

  const syncStats = useMemo(() => ({
    ok: rows.filter((r) => r.status === "ok").length,
    attention: failRows.length,
    versions: publishedVersions,
  }), [failRows.length, publishedVersions, rows]);

  const openDrawer = (mode: DrawerMode, row: SyncRow = activeRow) => {
    setActiveRow(row);
    setDrawerMode(mode);
  };

  const syncRow = (row: SyncRow) => {
    if (row.status === "missing") {
      toast.info(`${row.item} 需要先补接入规则或 fallback 文件`);
      openDrawer("log", row);
      return;
    }
    setRows((list) => list.map((item) => item.id === row.id ? { ...item, status: "syncing" } : item));
    toast.success(`${row.item} 已创建 mock 同步任务`);
    window.setTimeout(() => {
      setRows((list) => list.map((item) => item.id === row.id ? { ...item, status: "ok", lastSync: "刚刚", failReason: undefined } : item));
    }, 600);
  };

  const syncAll = () => {
    setRows((list) => list.map((item) => item.status === "missing" ? item : { ...item, status: "syncing" }));
    toast.success("已创建全部手动同步任务，未接入项保持原状态");
    window.setTimeout(() => {
      setRows((list) => list.map((item) => item.status === "missing" ? item : { ...item, status: "ok", lastSync: "刚刚", failReason: undefined }));
    }, 700);
  };

  return (
    <div className="px-6 py-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">插件管理</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            本轮只做数据爬虫 / 交易同步助手；自动报价机器人保持 On queue。
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => openDrawer("debug", rows[0])}>
          <Bug className="h-3.5 w-3.5 mr-1.5" /> Debug 单任务
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="方向 A · 爬虫插件">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>· 收益结算数据抓取</p>
            <p>· 交易平台数据收集处理</p>
            <p>· 采集产物进入“数据版本”，再供结算计算器消费</p>
            <p className="text-[11px]">来源标识：页面抓取 / 公开API / 规则计算 / Excel fallback</p>
          </div>
        </Panel>
        <Panel title="方向 B · 自动报价 / 自动售卖插件">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>· SP3</p>
            <p>· 自动报价机器人 · On queue / 待排期</p>
            <p>· 当前不提供启动、配置、报价、下单入口</p>
            <p className="text-[11px]">仅保留未来能力占位，避免误读成本轮交易机器人。</p>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="插件状态">
          <div className="space-y-2.5 text-sm">
            <StatusField label="插件在线状态"><Dot tone="success" /> 已连接</StatusField>
            <StatusField label="交易中心登录状态"><Dot tone="success" /> 已登录 · 安徽交易中心</StatusField>
            <StatusField label="浏览器连接">Chrome 120.0</StatusField>
            <StatusField label="最近心跳时间"><span className="font-mono text-xs">2026-04-30 10:32:18</span></StatusField>
            <StatusField label="数据版本产物"><span className="font-mono text-xs">{syncStats.versions} 个</span></StatusField>
          </div>
        </Panel>

        <Panel title="操作">
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" className="justify-start text-sm" onClick={() => toast.info("原型下载按钮：不生成真实插件安装包")}>
              <Download className="h-3.5 w-3.5 mr-2" /> 下载插件安装包
            </Button>
            <Button variant="outline" size="sm" className="justify-start text-sm" onClick={syncAll}>
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> 全部手动同步
            </Button>
            <Button variant="ghost" size="sm" className="justify-start text-sm" onClick={() => openDrawer("log", failRows[0] ?? rows[0])}>
              <FileText className="h-3.5 w-3.5 mr-2" /> 查看采集日志
            </Button>
          </div>
        </Panel>

        <Panel title="同步规则配置">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">自动同步</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm text-muted-foreground">同步频率</Label>
              <Select defaultValue="daily">
                <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">每日一次</SelectItem>
                  <SelectItem value="twice">每日两次</SelectItem>
                  <SelectItem value="hourly">每小时</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm text-muted-foreground">同步时间</Label>
              <Input className="w-32 h-8 text-sm" defaultValue="12:30" type="time" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">同步前确认</Label>
              <Switch defaultChecked />
            </div>
            <div className="pt-2 border-t">
              <Button size="sm" className="w-full" onClick={() => toast.success("同步配置已保存（mock）")}>保存配置</Button>
            </div>
          </div>
        </Panel>
      </div>

      {failRows.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 flex items-center gap-2 text-xs">
          <CircleAlert className="h-4 w-4 text-warning shrink-0" />
          <span className="font-medium text-foreground/90">{syncStats.attention} 项需要关注：</span>
          <span className="text-muted-foreground truncate">
            {failRows.map((r) => `${r.item}（${r.failReason ?? statusMeta[r.status].label}）`).join("，")}
          </span>
          <button className="ml-auto text-primary hover:underline shrink-0" onClick={() => openDrawer("log", failRows[0])}>
            查看日志
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="正常数据项" value={`${syncStats.ok}/${rows.length}`} />
        <MiniStat label="需关注" value={String(syncStats.attention)} tone="warning" />
        <MiniStat label="可用于测算的数据版本" value={String(syncStats.versions)} />
      </div>

      <div className="rounded-lg border bg-card shadow-notion overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">同步数据</h2>
          <span className="text-[11px] text-muted-foreground">共 {rows.length} 项</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/40 text-xs text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-medium">数据项</th>
              <th className="text-left px-4 py-2.5 font-medium">来源类型</th>
              <th className="text-left px-4 py-2.5 font-medium">最近同步</th>
              <th className="text-left px-4 py-2.5 font-medium">同步范围</th>
              <th className="text-left px-4 py-2.5 font-medium">覆盖率</th>
              <th className="text-left px-4 py-2.5 font-medium">数据版本</th>
              <th className="text-left px-4 py-2.5 font-medium">状态</th>
              <th className="text-right px-4 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const meta = statusMeta[row.status];
              const Icon = meta.Icon;
              return (
                <tr key={row.id} className="border-b last:border-b-0 hover:bg-secondary/30">
                  <td className="px-4 py-2.5 font-medium">{row.item}</td>
                  <td className="px-4 py-2.5"><SourcePill source={row.source} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{row.lastSync}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{row.range}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{row.coverage}</td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{row.dataVersion ?? "待生成"}</td>
                  <td className="px-4 py-2.5">
                    <div className="inline-flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${meta.color} ${row.status === "syncing" ? "animate-spin" : ""}`} />
                      <span className={`text-xs ${meta.color}`}>{meta.label}</span>
                      {row.failReason && <span className="text-[11px] text-muted-foreground">· {row.failReason}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button className="text-[11px] px-2 py-1 rounded hover:bg-secondary text-primary inline-flex items-center gap-1" onClick={() => syncRow(row)}>
                        {row.status === "fail" ? <RotateCw className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />} {row.status === "fail" ? "重试" : "手动同步"}
                      </button>
                      <button className="text-[11px] px-2 py-1 rounded hover:bg-secondary text-muted-foreground inline-flex items-center gap-1" onClick={() => openDrawer("log", row)}>
                        <FileText className="h-3 w-3" /> 查看日志
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground px-1 leading-relaxed">
        说明：本页为原型 mock。插件只负责数据采集、同步状态和版本产物，不提供自动报价、自动售卖或下单能力。
      </p>

      <Sheet open={drawerMode !== null} onOpenChange={(open) => !open && setDrawerMode(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{drawerMode === "debug" ? "Debug 单任务" : "采集日志"}</SheetTitle>
          </SheetHeader>
          {drawerMode === "debug" ? <DebugPanel row={activeRow} /> : <LogPanel row={activeRow} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function LogPanel({ row }: { row: SyncRow }) {
  const steps = [
    { time: "10:30:00", label: "读取任务计划", desc: `${row.item} / ${row.range}` },
    { time: "10:30:12", label: "采集来源", desc: `${row.source} · ${row.coverage}` },
    { time: "10:31:40", label: "生成数据版本", desc: row.dataVersion ?? "待生成" },
    { time: "10:32:18", label: row.status === "ok" ? "校验通过" : "需要处理", desc: row.failReason ?? statusMeta[row.status].label },
  ];
  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-md border bg-secondary/20 p-3 text-sm">
        <p className="font-medium">{row.item}</p>
        <p className="mt-1 text-xs text-muted-foreground">{row.range} · {row.source} · {row.dataVersion ?? "待生成"}</p>
      </div>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.time} className="rounded-md border bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{step.label}</p>
              <span className="font-mono text-[11px] text-muted-foreground">{step.time}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        日志用于定位采集、校验与数据版本产物，不代表真实后端任务日志。
      </p>
    </div>
  );
}

function DebugPanel({ row }: { row: SyncRow }) {
  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-md border border-warning/30 bg-warning/5 p-3">
        <p className="text-sm font-medium text-warning">Debug 单任务不申请租约、不 heartbeat、不回写后端。</p>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          该入口只用于排查一个采集项的选择器、字段映射和 mock 日志，不进入正式任务链路。
        </p>
      </div>
      <div className="grid gap-2 text-sm">
        <TraceLine label="任务项" value={row.item} />
        <TraceLine label="来源类型" value={row.source} />
        <TraceLine label="同步范围" value={row.range} />
        <TraceLine label="数据版本" value={row.dataVersion ?? "待生成"} mono />
      </div>
      <Button className="w-full" onClick={() => toast.success("Debug 单任务已执行（mock）")}>
        运行 Debug 单任务
      </Button>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card shadow-notion p-4">
      <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wider mb-2.5">{title}</h3>
      {children}
    </div>
  );
}

function StatusField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground shrink-0">{label}</p>
      <div className="text-sm text-right min-w-0 truncate">{children}</div>
    </div>
  );
}

function Dot({ tone }: { tone: "success" }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${tone === "success" ? "bg-success" : ""}`} />;
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-notion">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-mono font-semibold ${tone === "warning" ? "text-warning" : ""}`}>{value}</p>
    </div>
  );
}

function SourcePill({ source }: { source: SourceType }) {
  return <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[11px] text-muted-foreground">{source}</span>;
}

function TraceLine({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
