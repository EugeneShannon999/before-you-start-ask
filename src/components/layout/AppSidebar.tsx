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
        {/* 一级 Tab：选中放大显示名字，未选中收缩为图标 */}
        <div className="h-12 border-b flex items-stretch shrink-0 px-1.5 gap-1 py-1.5">
          {tabConfig.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                title={tab.label}
                className={`relative h-full rounded-md flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  active
                    ? "flex-1 bg-primary/10 text-primary px-2"
                    : "w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {active && (
                  <span className="text-xs font-medium truncate">{tab.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 二级菜单：扁平、低饱和，与一级 Tab 拉开层级 */}
        <nav className="flex-1 py-1.5 px-1.5 flex flex-col gap-px">
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
                className={`relative w-full h-8 flex items-center gap-2 px-2 rounded text-left transition-colors ${
                  isActive
                    ? "bg-secondary text-primary font-medium"
                    : item.placeholder
                    ? "text-muted-foreground/50 cursor-not-allowed"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary" />
                )}
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px] leading-none truncate">
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
