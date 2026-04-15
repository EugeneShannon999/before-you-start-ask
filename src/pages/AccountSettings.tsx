import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AccountSettings() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">账号设置</h1>

      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3">个人信息</h2>
        <div className="p-5 rounded-lg shadow-notion bg-card space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-medium">
              U
            </div>
            <div>
              <p className="text-sm font-medium">用户</p>
              <p className="text-xs text-muted-foreground">user@example.com</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">姓名</Label>
              <Input className="mt-1 h-9 text-sm" defaultValue="用户" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">手机号</Label>
              <Input className="mt-1 h-9 text-sm" defaultValue="138****8888" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">公司</Label>
              <Input className="mt-1 h-9 text-sm" defaultValue="XX售电公司" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">角色</Label>
              <Input className="mt-1 h-9 text-sm" defaultValue="交易员" readOnly />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3">偏好设置</h2>
        <div className="p-5 rounded-lg shadow-notion bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">默认地区</Label>
              <p className="text-xs text-muted-foreground">打开页面时默认显示的地区</p>
            </div>
            <Select defaultValue="anhui">
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anhui">安徽</SelectItem>
                <SelectItem value="shandong">山东</SelectItem>
                <SelectItem value="guangdong">广东</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">声音提醒</Label>
              <p className="text-xs text-muted-foreground">收到重要通知时播放声音</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">数据缓存</Label>
              <p className="text-xs text-muted-foreground">缓存市场数据以加速加载</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button>保存设置</Button>
      </div>
    </div>
  );
}
