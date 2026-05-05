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
  ArrowLeft,
  Download,
  RefreshCw,
  FileText,
  RotateCw,
  CircleCheck,
  CircleAlert,
  CircleX,
  CircleDashed,
  Bug,
  Play,
  Settings,
  Square,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

type SyncStatus = "ok" | "delay" | "fail" | "missing" | "syncing";
type SourceType = "公开API" | "页面抓取" | "规则计算" | "Excel fallback";
type DrawerMode = "log" | "debug" | null;
type PanelView = "collect" | "settings" | "debug";
type DemoScenario =
  | "normal"
  | "reading"
  | "planFail"
  | "noTasks"
  | "notDue"
  | "unconfigured"
  | "stopping"
  | "leaseBusy"
  | "heartbeatFail"
  | "platformMissing"
  | "serviceDown"
  | "configOpen"
  | "noDebugTasks"
  | "requestRunning"
  | "requestFail";

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

const scenarioOptions: Array<{ value: DemoScenario; label: string }> = [
  { value: "normal", label: "正常采集" },
  { value: "reading", label: "后端读取已有数据" },
  { value: "planFail", label: "后端计划读取失败" },
  { value: "noTasks", label: "没有可采集任务" },
  { value: "notDue", label: "存在未到期任务" },
  { value: "unconfigured", label: "存在未配置任务" },
  { value: "stopping", label: "停止中" },
  { value: "leaseBusy", label: "租约 busy" },
  { value: "heartbeatFail", label: "heartbeat 失败" },
  { value: "platformMissing", label: "未检测到交易平台" },
  { value: "serviceDown", label: "业务服务不可用" },
  { value: "configOpen", label: "采集配置未冻结" },
  { value: "noDebugTasks", label: "无可调试任务" },
  { value: "requestRunning", label: "请求运行中" },
  { value: "requestFail", label: "请求失败" },
];

const scenarioStatus: Record<DemoScenario, { label: string; tone: "success" | "warning" | "danger" | "muted"; hint: string; mainAction: string }> = {
  normal: { label: "已支持市场 · 安徽交易中心", tone: "success", hint: "后端计划已冻结，可按月度计划采集。", mainAction: "继续采集" },
  reading: { label: "后端正在读取已有数据", tone: "warning", hint: "正在比对已有版本与本月计划，按钮暂不可提交正式任务。", mainAction: "等待读取" },
  planFail: { label: "后端月度计划读取失败", tone: "danger", hint: "无法获取本月应采任务，需刷新服务或联系开发。", mainAction: "重新读取计划" },
  noTasks: { label: "没有可采集任务", tone: "muted", hint: "当前结算月没有到期任务或均已完成。", mainAction: "刷新状态" },
  notDue: { label: "存在未到期任务", tone: "warning", hint: "未到披露窗口的任务保留在计划中，不允许强采。", mainAction: "采集到期任务" },
  unconfigured: { label: "存在未配置任务", tone: "warning", hint: "部分任务缺 requestProfile，需要进入设置或任务调试。", mainAction: "采集已配置任务" },
  stopping: { label: "停止中", tone: "warning", hint: "用户已点击停止，等待当前任务释放。", mainAction: "停止采集" },
  leaseBusy: { label: "租约 busy", tone: "danger", hint: "已有其他采集租约占用，当前浏览器只能查看。", mainAction: "稍后重试" },
  heartbeatFail: { label: "heartbeat 失败", tone: "danger", hint: "采集运行中断，需重试或进入 Debug 单任务。", mainAction: "重新采集" },
  platformMissing: { label: "未检测到交易平台", tone: "danger", hint: "当前页面不是支持的交易中心域名。", mainAction: "不可采集" },
  serviceDown: { label: "业务服务不可用", tone: "danger", hint: "本地/后端业务服务未连接，无法读取目录与计划。", mainAction: "检查服务" },
  configOpen: { label: "采集配置未冻结", tone: "warning", hint: "市场目录或任务模板未冻结，只允许调试。", mainAction: "进入设置" },
  noDebugTasks: { label: "无可调试任务", tone: "muted", hint: "本月没有可调试任务项，任务调试页展示空态。", mainAction: "刷新状态" },
  requestRunning: { label: "请求运行中", tone: "warning", hint: "任务调试请求正在执行，展示运行中状态。", mainAction: "等待请求" },
  requestFail: { label: "请求失败", tone: "danger", hint: "任务调试请求返回失败，展示错误提示与响应状态。", mainAction: "重新运行" },
};

export default function PluginManagement() {
  const [rows, setRows] = useState(initialSyncRows);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [activeRow, setActiveRow] = useState<SyncRow>(initialSyncRows[0]);
  const [panelView, setPanelView] = useState<PanelView>("collect");
  const [scenario, setScenario] = useState<DemoScenario>("normal");
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
          <h1 className="text-lg font-semibold">交易同步助手模拟器</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Web 内模拟浏览器 side panel：采集主面板、设置页、任务调试页均为 mock；自动报价机器人保持 On queue。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={scenario} onValueChange={(v) => setScenario(v as DemoScenario)}>
            <SelectTrigger className="h-8 w-52 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {scenarioOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setPanelView("debug")}>
            <Bug className="h-3.5 w-3.5 mr-1.5" /> 打开任务调试
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px] items-start">
        <div className="space-y-4">
          <Panel title="收益测算与交易同步助手 · 原型入口">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border bg-background p-3">
                <p className="text-sm font-medium">收益测算后台</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  客户与套餐、数据版本、政策参数、测算任务、测算结果构成后台闭环。
                </p>
                <Button size="sm" className="mt-3" onClick={() => window.location.assign("/tools/calculator")}>
                  进入收益测算后台
                </Button>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-sm font-medium">交易同步助手</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  右侧 400px 面板模拟浏览器插件侧栏，不做真实 Manifest、租约、heartbeat 或回写。
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setPanelView("collect")}>
                  打开采集主面板
                </Button>
              </div>
            </div>
          </Panel>

          <Panel title="当前演示场景">
            <div className="space-y-3">
              <div className="rounded-md border bg-background p-3">
                <StatusStrip scenario={scenario} />
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{scenarioStatus[scenario].hint}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                  {scenarioOptions.map((item) => (
                    <span key={item.value} className="rounded bg-secondary/50 px-1.5 py-0.5">
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                <MiniStat label="应采任务" value={scenario === "noTasks" ? "0" : "28"} />
                <MiniStat label="完成" value={scenario === "reading" ? "读取中" : "21"} />
                <MiniStat label="失败" value={scenario === "heartbeatFail" || scenario === "planFail" ? "3" : "1"} tone="warning" />
                <MiniStat label="未配置" value={scenario === "unconfigured" ? "4" : "1"} tone={scenario === "unconfigured" ? "warning" : undefined} />
              </div>
            </div>
          </Panel>
        </div>

        <SyncSidePanel
          rows={rows}
          view={panelView}
          onViewChange={setPanelView}
          scenario={scenario}
          onScenarioChange={setScenario}
          onSyncAll={syncAll}
          onSyncRow={syncRow}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="方向 A · 数据爬虫 / 交易同步助手">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>· 收益结算数据抓取</p>
            <p>· 交易平台数据收集处理</p>
            <p>· 采集产物进入“数据版本”，再供收益测算后台消费</p>
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

function SyncSidePanel({
  rows,
  view,
  onViewChange,
  scenario,
  onScenarioChange,
  onSyncAll,
  onSyncRow,
}: {
  rows: SyncRow[];
  view: PanelView;
  onViewChange: (view: PanelView) => void;
  scenario: DemoScenario;
  onScenarioChange: (scenario: DemoScenario) => void;
  onSyncAll: () => void;
  onSyncRow: (row: SyncRow) => void;
}) {
  const settlementRows = rows.filter((row) => ["settlement", "contract", "price", "load-actual"].includes(row.id));
  const done = rows.filter((row) => row.status === "ok").length;
  const failed = rows.filter((row) => row.status === "fail" || row.status === "delay").length;
  const unconfigured = rows.filter((row) => row.status === "missing").length;
  const total = scenario === "noTasks" ? 0 : rows.length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const blocked = ["leaseBusy", "platformMissing", "serviceDown", "reading"].includes(scenario);
  const status = scenarioStatus[scenario];

  return (
    <div className="w-full max-w-[420px] justify-self-end">
      <div className="rounded-xl border bg-background shadow-notion overflow-hidden">
        <div className="h-12 border-b bg-card px-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">交易同步助手</p>
            <p className="text-[10px] text-muted-foreground">sync-helper v0.3.1 · mock side panel</p>
          </div>
          <div className="flex items-center gap-1">
            <Select defaultValue="2026-04">
              <SelectTrigger className="h-7 w-24 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2026-04">2026-04</SelectItem>
                <SelectItem value="2026-05">2026-05</SelectItem>
              </SelectContent>
            </Select>
            <button
              className="h-7 w-7 rounded-md inline-flex items-center justify-center hover:bg-secondary"
              onClick={() => onViewChange(view === "settings" ? "collect" : "settings")}
              aria-label="设置"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="px-3 py-2 border-b bg-secondary/20">
          <StatusStrip scenario={scenario} compact />
        </div>

        <div className="px-3 py-2 border-b">
          <Select value={scenario} onValueChange={(value) => onScenarioChange(value as DemoScenario)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {scenarioOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-h-[600px] bg-card">
          {view === "collect" && (
            <div className="p-3 space-y-3">
              <div className="rounded-lg border bg-background p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">月度状态</p>
                  <span className="text-xl font-mono font-semibold">{progress}%</span>
                </div>
                <ProgressBar value={progress} className="mt-2" />
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <TinyMetric label="已有" value={scenario === "reading" ? "..." : "21"} />
                  <TinyMetric label="应采" value={String(total)} />
                  <TinyMetric label="缺失" value={scenario === "planFail" ? "未知" : "3"} />
                  <TinyMetric label="未到期" value={scenario === "notDue" ? "5" : "2"} />
                </div>
                <div className="mt-3 space-y-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>日级进度</span>
                      <span>{scenario === "noTasks" ? "0/0" : "19/24"}</span>
                    </div>
                    <ProgressBar value={scenario === "noTasks" ? 0 : 79} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>月级进度</span>
                      <span>{scenario === "notDue" ? "18/28" : "24/28"}</span>
                    </div>
                    <ProgressBar value={scenario === "notDue" ? 64 : 86} />
                  </div>
                </div>
                <div className="mt-3 rounded-md bg-secondary/40 px-2 py-1.5 text-[11px] text-muted-foreground leading-relaxed">
                  {status.hint}
                </div>
              </div>

              <div className="rounded-lg border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">采集动作</p>
                    <p className="text-[11px] text-muted-foreground">任务总数 {total} · 完成 {done} · 失败 {failed} · 未配置 {unconfigured}</p>
                  </div>
                  {scenario === "stopping" ? <Square className="h-4 w-4 text-warning" /> : <Play className="h-4 w-4 text-primary" />}
                </div>
                <Button className="mt-3 w-full" disabled={blocked || scenario === "noTasks"} onClick={onSyncAll}>
                  {status.mainAction}
                </Button>
                {scenario === "stopping" && (
                  <Button variant="outline" className="mt-2 w-full" disabled>
                    停止采集中
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <TaskGroup
                  title="月度结算"
                  rows={settlementRows}
                  onRun={onSyncRow}
                  scenario={scenario}
                />
                <TaskGroup
                  title="市场运行数据"
                  rows={rows.filter((row) => ["notice", "tie-line", "must-run", "reserve"].includes(row.id))}
                  onRun={onSyncRow}
                  scenario={scenario}
                />
                <TaskGroup
                  title="预测与负荷"
                  rows={rows.filter((row) => ["load-fc", "renewable"].includes(row.id))}
                  onRun={onSyncRow}
                  scenario={scenario}
                />
              </div>
            </div>
          )}

          {view === "settings" && (
            <div className="p-3 space-y-3">
              <PanelHeader title="设置页" onBack={() => onViewChange("collect")} />
              <SideCard title="业务服务地址">
                <Input className="h-8 text-xs" defaultValue="http://127.0.0.1:8787" />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" className="h-8 flex-1" onClick={() => toast.success("保存成功（mock）")}>保存地址</Button>
                  <Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => toast.error("保存失败（mock）")}>演示失败</Button>
                </div>
              </SideCard>
              <SideCard title="市场目录">
                <p className="text-[11px] text-muted-foreground leading-relaxed">从业务服务读取交易市场目录，识别当前页面是否为支持市场。</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-8" onClick={() => toast.info("刷新中（mock）")}>刷新状态</Button>
                  <Button size="sm" className="h-8" disabled={scenario === "platformMissing"} onClick={() => toast.success("同步成功（mock）")}>同步市场目录</Button>
                </div>
                {scenario === "platformMissing" && <p className="mt-2 text-[11px] text-destructive">当前不在交易平台，不可同步。</p>}
              </SideCard>
              <SideCard title="开发调试">
                <p className="text-[11px] text-muted-foreground leading-relaxed">单独运行一个采集任务，用于验证选择器、请求配置和响应解析。</p>
                <Button className="mt-2 w-full" size="sm" disabled={scenario === "serviceDown" || scenario === "platformMissing"} onClick={() => onViewChange("debug")}>
                  进入任务调试
                </Button>
                {(scenario === "serviceDown" || scenario === "platformMissing") && (
                  <p className="mt-2 text-[11px] text-destructive">不可进入原因：业务服务不可用或未识别支持平台。</p>
                )}
              </SideCard>
            </div>
          )}

          {view === "debug" && (
            <div className="p-3 space-y-3">
              <PanelHeader title="任务调试页" onBack={() => onViewChange("settings")} />
              <SideCard title="结算月">
                <TraceLine label="当前结算月" value="2026-04" mono />
                <TraceLine label="调试模式" value="不进入正式任务链路" />
              </SideCard>
              <SideCard title="任务项">
                {scenario === "noDebugTasks" ? (
                  <div className="rounded-md bg-secondary/40 p-3 text-xs text-muted-foreground">
                    无可调试任务：当前结算月计划为空或任务模板未生成。
                  </div>
                ) : (
                  <>
                    <Select defaultValue="TASK-SETTLE-202604-02">
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {rows.slice(0, 6).map((row) => (
                          <SelectItem key={row.id} value={row.dataVersion ?? row.id}>{row.item} / {row.range}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 space-y-1.5">
                      <TraceLine label="任务名称" value="月度结算数据采集" />
                      <TraceLine label="业务日期" value="2026-04" mono />
                      <TraceLine label="状态" value={scenario === "unconfigured" ? "未配置 requestProfile" : scenario === "requestRunning" ? "请求运行中" : scenario === "requestFail" ? "请求失败" : "可调试"} />
                      <TraceLine label="覆盖粒度" value="客户 x 96 点" />
                    </div>
                    <Button className="mt-2 w-full" size="sm" disabled={scenario === "unconfigured" || scenario === "serviceDown" || scenario === "requestRunning"} onClick={() => scenario === "requestFail" ? toast.error("请求失败：选择器未命中目标表格（mock）") : toast.success("请求成功（mock）")}>
                      {scenario === "requestRunning" ? "请求运行中" : "运行选中任务"}
                    </Button>
                  </>
                )}
              </SideCard>
              <SideCard title="请求配置">
                <div className="flex gap-1 text-[11px]">
                  <span className="rounded bg-primary/10 px-2 py-1 text-primary">接口响应</span>
                  <span className="rounded bg-secondary px-2 py-1 text-muted-foreground">文件响应</span>
                  <span className="rounded bg-secondary px-2 py-1 text-muted-foreground">未配置</span>
                </div>
                <pre className="mt-2 max-h-28 overflow-auto rounded bg-secondary/40 p-2 text-[10px] leading-relaxed">{`{
  "method": "GET",
  "path": "/settlement/monthly",
  "params": { "month": "2026-04" }
}`}</pre>
                <TraceLine label="响应状态" value={scenario === "heartbeatFail" || scenario === "requestFail" ? "500" : scenario === "requestRunning" ? "pending" : "200"} mono />
                <TraceLine label="finalUrl" value="https://trade.example/settlement/monthly" mono />
                <TraceLine label="byteLength" value="248192" mono />
                <TraceLine label="fileName" value="settlement-202604.json" mono />
                {scenario === "unconfigured" && <p className="text-[11px] text-destructive">错误提示：当前任务未配置 requestProfile。</p>}
                {scenario === "requestFail" && <p className="text-[11px] text-destructive">错误提示：选择器未命中目标表格或响应解析失败。</p>}
                {scenario === "requestRunning" && <p className="text-[11px] text-warning">运行结果提示：请求执行中，等待响应返回。</p>}
              </SideCard>
              <div className="rounded-md border border-warning/30 bg-warning/5 p-3">
                <p className="text-sm font-medium text-warning">Debug 单任务不申请租约、不 heartbeat、不回写后端。</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusStrip({ scenario, compact = false }: { scenario: DemoScenario; compact?: boolean }) {
  const status = scenarioStatus[scenario];
  const toneClass = {
    success: "border-success/30 bg-success/5 text-success",
    warning: "border-warning/30 bg-warning/5 text-warning",
    danger: "border-destructive/30 bg-destructive/5 text-destructive",
    muted: "border-border bg-muted text-muted-foreground",
  }[status.tone];
  return (
    <div className={`rounded-md border px-2 py-1.5 ${toneClass}`}>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        <span className={compact ? "text-[11px] font-medium" : "text-xs font-medium"}>{status.label}</span>
      </div>
    </div>
  );
}

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2 rounded-full bg-secondary overflow-hidden ${className}`}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function TinyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/40 px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xs font-mono font-medium">{value}</p>
    </div>
  );
}

function TaskGroup({ title, rows, scenario, onRun }: { title: string; rows: SyncRow[]; scenario: DemoScenario; onRun: (row: SyncRow) => void }) {
  const done = rows.filter((row) => row.status === "ok").length;
  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-[11px] text-muted-foreground">{done}/{rows.length} 完成</p>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={scenario === "leaseBusy"}>重采</Button>
      </div>
      <div>
        {rows.map((row) => (
          <div key={row.id} className="px-3 py-2 border-b last:border-b-0 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{row.item}</p>
              <p className="text-[10px] text-muted-foreground truncate">{row.range} · {row.coverage}</p>
              {row.failReason && <p className="text-[10px] text-warning truncate">{row.failReason}</p>}
            </div>
            <span className="text-[10px] text-muted-foreground">{statusMeta[row.status].label}</span>
            <button className="text-[11px] text-primary hover:underline" disabled={scenario === "leaseBusy"} onClick={() => onRun(row)}>
              运行
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button className="h-7 w-7 rounded-md inline-flex items-center justify-center hover:bg-secondary" onClick={onBack} aria-label="返回">
        <ArrowLeft className="h-3.5 w-3.5" />
      </button>
      <p className="text-sm font-semibold">{title}</p>
    </div>
  );
}

function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-sm font-medium mb-2">{title}</p>
      {children}
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
