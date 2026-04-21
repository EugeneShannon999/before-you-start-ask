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
// 插件管理 (SP1)
// ------------------------------------------------------------
// 同步项与「市场看板」实际展示的数据严格对齐：
//   公告信息、日前/实时电价、负荷预测、实际负荷、新能源预测、
//   联络线计划、断面限额、实际输电、必开/必停机组、正备用/负备用
//
// 来源类型口径（SP1 仅这 3 类，统一原则）：
//   公开API   - 由交易中心 / 调度公开接口拉取
//   页面抓取  - 浏览器插件抓取页面 DOM 解析
//   规则计算  - 基于已采集原始数据由本地规则引擎加工
// 不再使用「插件同步」（属于接入方式而非数据来源）。
//
// 状态口径：
//   正常 / 延迟 / 失败 / 未接入
//
// 备注：
//   - U盾相关检测当前 SP1 暂不展示，待 SP2 单列「U盾检测状态」
//   - 失败原因目前为 mock，SP2 接入后端 sync_logs 表
//   - 「正备用/负备用」按方案A：展示原始数据 → 公开API
//     （非"是否偏紧"的判断结果；判断结果会作为独立"备用预警"行接入规则计算）
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
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">插件管理</h1>
        <Button variant="outline" size="sm" className="text-sm">
          <Download className="h-3.5 w-3.5 mr-1" /> 下载插件安装包
        </Button>
      </div>

      {/* 插件状态 */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3">插件状态</h2>
        <div className="p-5 rounded-lg shadow-notion bg-card">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
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
        </div>
      </div>

      {/* 同步数据 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">同步数据</h2>
          <Button variant="outline" size="sm" className="text-sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> 全部手动同步
          </Button>
        </div>
        <div className="rounded-lg shadow-notion bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50 text-xs text-muted-foreground">
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
        <p className="text-[11px] text-muted-foreground mt-2 px-1">
          说明：本页仅展示 SP1 已接入的数据项。来源类型分为公开API、页面抓取、规则计算。失败或延迟原因可在「查看日志」中查看。
        </p>
      </div>

      {/* 同步规则配置 */}
      <div>
        <h2 className="text-sm font-semibold mb-3">同步规则配置</h2>
        <div className="p-5 rounded-lg shadow-notion bg-card space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">自动同步</Label>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">同步时间</Label>
              <Input className="w-24 h-8 text-sm" defaultValue="12:30" type="time" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">同步前确认</Label>
            <Switch defaultChecked />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button>保存配置</Button>
        </div>
      </div>
    </div>
  );
}

function StatusField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
