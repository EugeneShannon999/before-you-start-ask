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
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
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

// AI 能力（与 PolicyCenter 内的 capabilities 对齐）
interface AiCapability {
  key: "policy" | "review";
  title: string;
  icon: LucideIcon;
  placeholder?: boolean;
}

const aiCapabilities: AiCapability[] = [
  { key: "policy", title: "政策 AI", icon: Brain },
  { key: "review", title: "复盘助手", icon: History, placeholder: true },
];

// AI 最近会话（mock，与 PolicyCenter 内保持一致）
const aiRecentSessions: { id: string; title: string; ts: string }[] = [
  { id: "p1", title: "7月安徽偏差考核新规解读", ts: "10:32" },
  { id: "p2", title: "全国统一电力市场征求意见影响", ts: "昨天" },
  { id: "p3", title: "广东现货分段考核机制", ts: "2天前" },
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

const tabConfig: { key: SidebarTab; label: string; icon: LucideIcon }[] = [
  { key: "ai", label: "AI", icon: Bot },
  { key: "dashboard", label: "看板", icon: LayoutDashboard },
  { key: "plugin", label: "插件", icon: Puzzle },
];

function getTabFromPath(pathname: string): SidebarTab {
  if (pathname.startsWith("/ai")) return "ai";
  if (pathname.startsWith("/system/plugin")) return "plugin";
  return "dashboard";
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<SidebarTab>(() => getTabFromPath(location.pathname));

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabClick = (tab: SidebarTab) => {
    setActiveTab(tab);
    if (tab === "ai") {
      navigate("/ai/policy?cap=policy");
    } else if (tab === "dashboard") {
      navigate(dashboardItems[0].url);
    } else if (tab === "plugin") {
      navigate(pluginItems[0].url);
    }
  };

  // 当前 AI 能力（仅 AI tab 时使用）
  const activeCap = (searchParams.get("cap") as "policy" | "review") || "policy";

  return (
    <Sidebar collapsible="none" className="border-r bg-sidebar">
      <SidebarContent className="p-0 flex flex-col items-stretch">
        {/* 一级 Tab */}
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

        {/* 二级菜单：AI tab 显示能力+最近会话；其他 tab 显示通用 nav */}
        {activeTab === "ai" ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* 新建会话 */}
            <div className="px-1.5 py-1.5 border-b">
              <button
                onClick={() => navigate("/ai/policy?cap=policy")}
                className="w-full flex items-center justify-center gap-1 h-7 rounded bg-primary text-primary-foreground hover:opacity-90 text-[11px]"
              >
                <Plus className="h-3 w-3" />
                新建会话
              </button>
            </div>

            {/* AI 能力 */}
            <div className="px-1.5 pt-1.5 pb-1">
              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider px-1.5 pb-1">
                AI 能力
              </p>
              <div className="flex flex-col gap-px">
                {aiCapabilities.map((c) => {
                  const isActive = !c.placeholder && activeCap === c.key;
                  const handleClick = () => {
                    if (c.placeholder) return;
                    navigate(`/ai/policy?cap=${c.key}`);
                  };
                  return (
                    <button
                      key={c.key}
                      onClick={handleClick}
                      title={c.title + (c.placeholder ? " (占位)" : "")}
                      className={`relative w-full h-7 flex items-center gap-1.5 px-2 rounded text-left transition-colors ${
                        isActive
                          ? "bg-secondary text-primary font-medium"
                          : c.placeholder
                          ? "text-muted-foreground/50 cursor-not-allowed"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary" />
                      )}
                      <c.icon className="h-3 w-3 shrink-0" />
                      <span className="text-[11px] leading-none truncate flex-1">{c.title}</span>
                      {c.placeholder && (
                        <span className="text-[8px] px-1 rounded bg-muted text-muted-foreground">
                          占位
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 最近会话 */}
            <div className="px-1.5 pt-2 pb-1.5 border-t mt-1 flex-1 min-h-0 flex flex-col">
              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider px-1.5 pb-1 shrink-0">
                最近会话
              </p>
              <div className="flex-1 overflow-auto flex flex-col gap-px">
                {aiRecentSessions.map((s) => (
                  <button
                    key={s.id}
                    title={s.title}
                    className="w-full flex flex-col gap-0.5 px-2 py-1 rounded hover:bg-secondary/60 text-left text-muted-foreground hover:text-foreground"
                  >
                    <span className="text-[11px] leading-tight truncate">{s.title}</span>
                    <span className="text-[9px] text-muted-foreground/70">{s.ts}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <nav className="flex-1 py-1.5 px-1.5 flex flex-col gap-px">
            {(activeTab === "dashboard" ? dashboardItems : pluginItems).map((item) => {
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
        )}
      </SidebarContent>
    </Sidebar>
  );
}
