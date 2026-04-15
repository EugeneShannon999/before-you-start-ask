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
import { Check, AlertTriangle, Download } from "lucide-react";

const syncData = [
  { type: "日前电量", lastSync: "2025-07-15 14:30", range: "7月1-15日", status: "ok" },
  { type: "实时电量", lastSync: "2025-07-15 14:30", range: "7月1-15日", status: "ok" },
  { type: "中长期合约", lastSync: "2025-07-01 10:00", range: "7月全月", status: "ok" },
  { type: "PT售均", lastSync: "2025-07-15 09:00", range: "7月1-14日", status: "warning" },
];

export default function PluginManagement() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">插件管理</h1>
        <Button variant="outline" size="sm" className="text-sm">
          <Download className="h-3.5 w-3.5 mr-1" /> 下载插件安装包
        </Button>
      </div>

      {/* Plugin Status */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3">插件状态</h2>
        <div className="p-5 rounded-lg shadow-notion bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success" />
              <span className="text-sm font-medium">插件已连接</span>
            </div>
            <span className="text-xs text-muted-foreground">最后同步：5分钟前</span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>U盾状态：已登录（安徽电力交易中心）</p>
            <p>浏览器：Chrome 120.0</p>
          </div>
        </div>
      </div>

      {/* Sync Data */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">同步数据</h2>
          <Button variant="outline" size="sm" className="text-sm">手动同步</Button>
        </div>
        <div className="rounded-lg shadow-notion bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">数据类型</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">最后同步时间</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">数据范围</th>
                <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground">状态</th>
              </tr>
            </thead>
            <tbody>
              {syncData.map((row, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="px-4 py-2.5">{row.type}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.lastSync}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.range}</td>
                  <td className="px-4 py-2.5 text-center">
                    {row.status === "ok" ? (
                      <Check className="h-4 w-4 text-success inline" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Rules */}
      <div>
        <h2 className="text-sm font-semibold mb-3">同步规则配置</h2>
        <div className="p-5 rounded-lg shadow-notion bg-card space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">自动同步</Label>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center gap-4">
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
            <div>
              <Label className="text-sm">同步前确认</Label>
              <p className="text-xs text-muted-foreground">弹窗询问是否同步</p>
            </div>
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
