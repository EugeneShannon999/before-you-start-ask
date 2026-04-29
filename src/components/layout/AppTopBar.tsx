import { useMemo, useState } from "react";
import { Bell, Settings, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { P1Ticker } from "@/components/messages/P1Ticker";
import { ruleAlertReports } from "@/lib/marketMocks";

type AlertFilter = "全部" | "已读" | "未读";

export function AppTopBar() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AlertFilter>("全部");
  const unreadCount = ruleAlertReports.filter((item) => item.status === "待处理").length;
  const visibleAlerts = useMemo(() => {
    if (filter === "未读") return ruleAlertReports.filter((item) => item.status === "待处理");
    if (filter === "已读") return ruleAlertReports.filter((item) => item.status !== "待处理");
    return ruleAlertReports;
  }, [filter]);

  return (
    <header className="sticky top-0 z-40 h-12 flex items-center border-b px-4 gap-3 shrink-0 bg-card">
      <SidebarTrigger className="-ml-1 shrink-0" />

      <div className="min-w-0 flex-1">
        <P1Ticker compact />
      </div>

      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-1.5 rounded-md hover:bg-secondary transition-colors" aria-label="运行规则预警">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-destructive px-1 text-[10px] leading-4 text-destructive-foreground text-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[420px] max-w-[calc(100vw-1.5rem)] p-0">
            <div className="border-b px-3 py-2">
              <p className="text-sm font-semibold">运行规则预警盒子 / 数据规则提醒中心</p>
              <div className="mt-2 flex rounded-md border bg-background p-0.5 text-xs">
                {(["全部", "已读", "未读"] as AlertFilter[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`h-7 flex-1 rounded px-2 ${filter === item ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[420px] overflow-auto p-2">
              {visibleAlerts.map((item) => {
                const unread = item.status === "待处理";
                return (
                  <div key={`${item.time}-${item.ruleName}`} className="rounded-md border bg-background px-3 py-2 mb-2 last:mb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{item.ruleName}</p>
                      {unread && <span className="mt-0.5 h-2 w-2 rounded-full bg-destructive shrink-0" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.reason}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      <span className="font-mono">数据日 {item.dataDate}</span>
                      <span className="font-mono">披露 {item.disclosureTime}</span>
                      <span className="font-mono">入库 {item.ingestTime}</span>
                      <span>{item.delayStatus}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

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
