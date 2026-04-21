import { useState, useEffect } from "react";
import {
  Brain,
  MessageSquare,
  PieChart,
  History,
  BarChart3,
  LineChart,
  Calculator,
  Calendar,
  Zap,
  Plug,
  Bot,
  LayoutDashboard,
  Puzzle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type SidebarTab = "ai" | "dashboard" | "plugin";

interface NavItem {
  title: string;
  url: string;
  icon: typeof Brain;
  placeholder?: boolean;
}

// AI 工作台共用一个路由，左侧只是切换 capability（页面内 state），
// 这里仍按 SP1 文案列出 4 个能力入口。
const aiItems: NavItem[] = [
  { title: "政策 AI", url: "/ai/policy", icon: Brain },
  { title: "交易问答", url: "/ai/policy", icon: MessageSquare },
  { title: "图表解读", url: "/ai/policy", icon: PieChart },
  { title: "复盘助手", url: "/ai/policy", icon: History },
];

const dashboardItems: NavItem[] = [
  { title: "市场看板", url: "/tools/market", icon: BarChart3 },
  { title: "算法预测", url: "/tools/prediction", icon: LineChart },
  { title: "结算计算器", url: "/tools/calculator", icon: Calculator },
  { title: "交易日历", url: "/tools/calendar", icon: Calendar },
  { title: "交易执行", url: "/tools/trading", icon: Zap, placeholder: true },
];

const pluginItems: NavItem[] = [
  { title: "插件管理", url: "/system/plugin", icon: Plug },
];

const tabConfig: { key: SidebarTab; label: string; icon: typeof Bot }[] = [
  { key: "ai", label: "AI", icon: Bot },
  { key: "dashboard", label: "看板", icon: LayoutDashboard },
  { key: "plugin", label: "插件", icon: Puzzle },
];

const tabMenuMap: Record<SidebarTab, { label: string; items: NavItem[] }[]> = {
  ai: [{ label: "AI 能力", items: aiItems }],
  dashboard: [{ label: "业务工具", items: dashboardItems }],
  plugin: [{ label: "插件", items: pluginItems }],
};

function getTabFromPath(pathname: string): SidebarTab {
  if (pathname.startsWith("/ai")) return "ai";
  if (pathname.startsWith("/system/plugin")) return "plugin";
  return "dashboard";
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<SidebarTab>(() => getTabFromPath(location.pathname));

  // 路由变化时自动同步顶部 Tab
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const groups = tabMenuMap[activeTab];

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="pt-0">
        {/* Tab switcher：选中态展开图标+文字，未选中收为小图标按钮 */}
        {!collapsed && (
          <div className="flex items-stretch gap-0.5 p-1 border-b bg-secondary/30">
            {tabConfig.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  title={tab.label}
                  className={`flex items-center justify-center gap-1 h-6 rounded text-[11px] font-medium transition-all ${
                    active
                      ? "flex-1 bg-card text-primary shadow-notion px-1.5"
                      : "w-6 shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <tab.icon className="h-3 w-3 shrink-0" />
                  {active && <span className="truncate">{tab.label}</span>}
                </button>
              );
            })}
          </div>
        )}

        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {!collapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-secondary/80 transition-colors"
                        activeClassName="bg-secondary text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="text-sm flex items-center gap-1.5">
                            {item.title}
                            {item.placeholder && (
                              <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                                占位
                              </span>
                            )}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
