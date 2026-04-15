import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppTopBar() {
  return (
    <header className="h-12 flex items-center border-b px-4 gap-3 shrink-0 bg-card">
      <SidebarTrigger className="-ml-1" />
      
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-primary">⚡</span>
        <span>电力交易管理系统</span>
      </div>

      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索..."
            className="h-8 pl-8 text-sm bg-secondary border-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-1.5 rounded-md hover:bg-secondary transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-destructive rounded-full" />
        </button>
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
          U
        </div>
      </div>
    </header>
  );
}
