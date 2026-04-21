import { useState, useEffect } from "react";
import {
  Brain,
  BarChart3,
  LineChart,
  Calculator,
  Calendar,
  Zap,
  Plug,
  Bot,
  LayoutDashboard,
  Puzzle,
  History,
  type LucideIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";

type SidebarTab = "ai" | "dashboard" | "plugin";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  placeholder?: boolean;
}

const aiItems: NavItem[] = [
  { title: "政策 AI", url: "/ai/policy", icon: Brain },
  { title: "复盘助手", url: "/ai/policy", icon: History, placeholder: true },
];

const dashboardItems: NavItem[] = [
  { title: "市场看板", url: "/tools/market", icon: BarChart3 },
  { title: "算法预测", url: "/tools/prediction", icon: LineChart },
  { title: "结算计算", url: "/tools/calculator", icon: Calculator },
  { title: "交易日历", url: "/tools/calendar", icon: Calendar },
  { title: "交易执行", url: "/tools/trading", icon: Zap, placeholder: true },
];

const pluginItems: NavItem[] = [
  { title: "插件管理", url: "/system/plugin", icon: Plug },
];

const tabConfig: { key: SidebarTab; label: string; icon: LucideIcon; items: NavItem[] }[] = [
  { key: "ai", label: "AI", icon: Bot, items: aiItems },
  { key: "dashboard", label: "看板", icon: LayoutDashboard, items: dashboardItems },
  { key: "plugin", label: "插件", icon: Puzzle, items: pluginItems },
];

function getTabFromPath(pathname: string): SidebarTab {
  if (pathname.startsWith("/ai")) return "ai";
  if (pathname.startsWith("/system/plugin")) return "plugin";
  return "dashboard";
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SidebarTab>(() => getTabFromPath(location.pathname));

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const items = tabConfig.find((t) => t.key === activeTab)?.items ?? [];

  const handleTabClick = (tab: SidebarTab) => {
    setActiveTab(tab);
    const first = tabConfig.find((t) => t.key === tab)?.items[0];
    if (first && !first.placeholder) navigate(first.url);
  };

  return (
    <Sidebar collapsible="none" className="border-r bg-sidebar">
      <SidebarContent className="p-0 flex flex-col items-stretch">
        {/* Tab switcher: 顶部 3 个一级栏目，与顶栏同高 */}
        <div className="h-12 border-b flex items-stretch shrink-0">
          {tabConfig.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                title={tab.label}
                className={`flex-1 flex items-center justify-center transition-colors relative ${
                  active
                    ? "text-primary bg-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-t" />
                )}
              </button>
            );
          })}
        </div>

        {/* 当前 Tab 下的二级图标导航：垂直、选中/未选中统一设计 */}
        <nav className="flex-1 py-2 px-1.5 flex flex-col gap-0.5">
          {items.map((item) => {
            const isActive = !item.placeholder && location.pathname === item.url;
            const handleClick = (e: React.MouseEvent) => {
              if (item.placeholder) {
                e.preventDefault();
                return;
              }
              navigate(item.url);
            };
            return (
              <button
                key={item.title}
                onClick={handleClick}
                title={item.title + (item.placeholder ? " (占位)" : "")}
                className={`relative w-full h-12 flex flex-col items-center justify-center gap-0.5 rounded-md transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : item.placeholder
                    ? "text-muted-foreground/50 cursor-not-allowed"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-primary" />
                )}
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="text-[10px] leading-none truncate max-w-full px-1">
                  {item.title.replace(" ", "")}
                </span>
              </button>
            );
          })}
        </nav>
      </SidebarContent>
    </Sidebar>
  );
}
