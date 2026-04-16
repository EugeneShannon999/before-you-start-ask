import { useState } from "react";
import {
  Brain,
  FileText,
  BarChart3,
  Calculator,
  Calendar,
  LineChart,
  Plug,
  Zap,
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

const aiItems = [
  { title: "政策AI", url: "/ai/policy", icon: Brain },
];

const dashboardItems = [
  { title: "市场信息", url: "/tools/market", icon: BarChart3 },
  { title: "算法预测", url: "/tools/prediction", icon: LineChart },
  { title: "结算计算器", url: "/tools/calculator", icon: Calculator },
  { title: "交易日历", url: "/tools/calendar", icon: Calendar },
  { title: "交易执行", url: "/tools/trading", icon: Zap },
];

const pluginItems = [
  { title: "插件管理", url: "/system/plugin", icon: Plug },
];

const tabConfig: { key: SidebarTab; label: string; icon: typeof Bot }[] = [
  { key: "ai", label: "AI", icon: Bot },
  { key: "dashboard", label: "看板", icon: LayoutDashboard },
  { key: "plugin", label: "插件", icon: Puzzle },
];

const tabMenuMap: Record<SidebarTab, { label: string; items: typeof aiItems }[]> = {
  ai: [{ label: "AI 能力", items: aiItems }],
  dashboard: [{ label: "业务工具", items: dashboardItems }],
  plugin: [{ label: "插件", items: pluginItems }],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  // Auto-select tab based on current route
  const getActiveTab = (): SidebarTab => {
    if (location.pathname.startsWith("/ai")) return "ai";
    if (location.pathname.startsWith("/system/plugin")) return "plugin";
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState<SidebarTab>(getActiveTab);

  const groups = tabMenuMap[activeTab];

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="pt-0">
        {/* Tab switcher */}
        {!collapsed && (
          <div className="flex border-b">
            {tabConfig.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
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
                        {!collapsed && <span className="text-sm">{item.title}</span>}
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
