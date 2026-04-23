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
  Download,
  RefreshCw,
  FileText,
  RotateCw,
  CircleCheck,
  CircleAlert,
  CircleX,
  CircleDashed,
} from "lucide-react";

// ============================================================
// 插件管理 (SP1) - 两栏版式
// ------------------------------------------------------------
//   左：全局导航（AppLayout 提供）
//   右：主工作区
//     · 顶部一排状态/操作/规则三张并排卡片（窄屏堆叠）
//     · 下方失败提示
//     · 主同步数据表（全宽，避免被中栏挤窄）
//
// 来源类型口径（SP1 仅这 3 类）：公开API / 页面抓取 / 规则计算
// 不再使用「插件同步」（属于接入方式而非数据来源）
// ============================================================

type SyncStatus = "ok" | "delay" | "fail" | "missing";
type SourceType = "公开API" | "页面抓取" | "规则计算";

interface SyncRow {
  item: string;
  source: SourceType;
  lastSync: string;
  range: string;
  status: SyncStatus;
  failReason?: string;
}

const syncRows: SyncRow[] = [
  { item: "公告信息", source: "页面抓取", lastSync: "2025-07-15 10:32", range: "近 30 天", status: "ok" },
  { item: "日前/实时电价", source: "公开API", lastSync: "2025-07-15 10:30", range: "D-1 ~ D", status: "ok" },
  { item: "负荷预测", source: "公开API", lastSync: "2025-07-15 10:30", range: "D 全日 96 点", status: "ok" },
  { item: "实际负荷", source: "公开API", lastSync: "2025-07-15 10:15", range: "D 截至 10:15", status: "delay", failReason: "接口响应延迟" },
  { item: "新能源预测", source: "公开API", lastSync: "2025-07-15 10:30", range: "D 全日 96 点", status: "ok" },
  { item: "联络线计划", source: "公开API", lastSync: "2025-07-15 09:00", range: "D 全日", status: "ok" },
  { item: "断面限额", source: "公开API", lastSync: "2025-07-15 09:00", range: "D 全日", status: "ok" },
  { item: "实际输电", source: "公开API", lastSync: "—", range: "D 全日", status: "fail", failReason: "接口超时" },
  { item: "必开/必停机组", source: "公开API", lastSync: "2025-07-15 08:30", range: "D 全日", status: "ok" },
  { item: "正备用/负备用", source: "公开API", lastSync: "2025-07-15 10:30", range: "D 全日", status: "ok" },
];

const statusMeta: Record<SyncStatus, { label: string; color: string; Icon: typeof CircleCheck }> = {
  ok: { label: "正常", color: "text-success", Icon: CircleCheck },
  delay: { label: "延迟", color: "text-warning", Icon: CircleAlert },
  fail: { label: "失败", color: "text-destructive", Icon: CircleX },
  missing: { label: "未接入", color: "text-muted-foreground", Icon: CircleDashed },
};

export default function PluginManagement() {
  const failRows = syncRows.filter((r) => r.status === "fail" || r.status === "delay");

  return (
    <div className="px-6 py-5 space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">插件管理</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="方向 A · 爬虫插件">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>· 收益结算数据抓取</p>
            <p>· 交易平台数据收集处理</p>
            <p className="text-[11px]">来源标识：页面抓取 / 公开API / 规则计算</p>
          </div>
        </Panel>
        <Panel title="方向 B · 自动报价 / 自动售卖插件">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>· SP3</p>
            <p>· 风险评估中</p>
            <p>· 暂不作为当前可用功能</p>
            <p className="text-[11px]">待电力交易事业部部门变动及内部风险评估完成后再启动</p>
          </div>
        </Panel>
      </div>

      {/* 顶部三卡：状态 / 操作 / 同步规则 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 插件状态 */}
        <Panel title="插件状态">
          <div className="space-y-2.5 text-sm">
            <StatusField label="插件在线状态">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="font-medium">已连接</span>
              </span>
            </StatusField>
            <StatusField label="交易中心登录状态">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="font-medium">已登录</span>
                <span className="text-xs text-muted-foreground">安徽交易中心</span>
              </span>
            </StatusField>
            <StatusField label="浏览器连接">
              <span className="font-medium">Chrome 120.0</span>
            </StatusField>
            <StatusField label="最近心跳时间">
              <span className="font-mono text-xs">2025-07-15 10:32:18</span>
            </StatusField>
            <StatusField label="最近同步时间">
              <span className="font-mono text-xs">2025-07-15 10:30:00</span>
            </StatusField>
          </div>
        </Panel>

        {/* 操作 */}
        <Panel title="操作">
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" className="justify-start text-sm">
              <Download className="h-3.5 w-3.5 mr-2" /> 下载插件安装包
            </Button>
            <Button variant="outline" size="sm" className="justify-start text-sm">
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> 全部手动同步
            </Button>
          </div>
        </Panel>

        {/* 同步规则配置 */}
        <Panel title="同步规则配置">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">自动同步</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm text-muted-foreground">同步频率</Label>
              <Select defaultValue="daily">
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
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
              <Button size="sm" className="w-full">保存配置</Button>
            </div>
          </div>
        </Panel>
      </div>

      {/* 失败/延迟项提示 */}
      {failRows.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 flex items-center gap-2 text-xs">
          <CircleAlert className="h-4 w-4 text-warning shrink-0" />
          <span className="font-medium text-foreground/90">
            {failRows.length} 项需要关注：
          </span>
          <span className="text-muted-foreground truncate">
            {failRows.map((r) => `${r.item}（${r.failReason}）`).join("，")}
          </span>
          <button className="ml-auto text-primary hover:underline shrink-0">
            查看日志
          </button>
        </div>
      )}

      {/* 同步数据表（主区域，全宽） */}
      <div className="rounded-lg border bg-card shadow-notion overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">同步数据</h2>
          <span className="text-[11px] text-muted-foreground">共 {syncRows.length} 项</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/40 text-xs text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-medium">数据项</th>
              <th className="text-left px-4 py-2.5 font-medium">来源类型</th>
              <th className="text-left px-4 py-2.5 font-medium">最近同步</th>
              <th className="text-left px-4 py-2.5 font-medium">同步范围</th>
              <th className="text-left px-4 py-2.5 font-medium">状态</th>
              <th className="text-right px-4 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {syncRows.map((row) => {
              const meta = statusMeta[row.status];
              const Icon = meta.Icon;
              return (
                <tr key={row.item} className="border-b last:border-b-0 hover:bg-secondary/30">
                  <td className="px-4 py-2.5 font-medium">{row.item}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[11px] text-muted-foreground">
                      {row.source}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                    {row.lastSync}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{row.range}</td>
                  <td className="px-4 py-2.5">
                    <div className="inline-flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                      <span className={`text-xs ${meta.color}`}>{meta.label}</span>
                      {row.failReason && (
                        <span className="text-[11px] text-muted-foreground">· {row.failReason}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      {row.status === "fail" ? (
                        <button className="text-[11px] px-2 py-1 rounded hover:bg-secondary text-primary inline-flex items-center gap-1">
                          <RotateCw className="h-3 w-3" /> 重试
                        </button>
                      ) : (
                        <button className="text-[11px] px-2 py-1 rounded hover:bg-secondary text-foreground/80 inline-flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" /> 手动同步
                        </button>
                      )}
                      <button className="text-[11px] px-2 py-1 rounded hover:bg-secondary text-muted-foreground inline-flex items-center gap-1">
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
        说明：本页仅展示 SP1 已接入的数据项。来源类型分为公开API、页面抓取、规则计算。失败或延迟原因可在「查看日志」中查看。
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card shadow-notion p-4">
      <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wider mb-2.5">
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatusField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground shrink-0">{label}</p>
      <div className="text-sm text-right min-w-0 truncate">{children}</div>
    </div>
  );
}
