import { Search, Bell, Settings, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function AppTopBar() {
  const navigate = useNavigate();

  return (
    <header className="h-12 flex items-center border-b px-4 gap-3 shrink-0 bg-card">
      <SidebarTrigger className="-ml-1" />
      
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-primary">⚡</span>
        <span>电力交易管理系统</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button className="relative p-1.5 rounded-md hover:bg-secondary transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-destructive rounded-full" />
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity">
              U
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1">
            <button
              onClick={() => navigate("/system/account")}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              账号设置
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors text-destructive"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
