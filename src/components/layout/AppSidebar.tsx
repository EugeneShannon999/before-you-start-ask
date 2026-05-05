import { useMemo, useState, useEffect } from "react";
import {
  BarChart3,
  LineChart,
  Calendar,
  Calculator,
  Zap,
  Plug,
  CloudSun,
  Bot,
  LayoutDashboard,
  History,
  Megaphone,
  Plus,
  Pin,
  PinOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, useSidebar } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatSessions } from "@/lib/aiSessionStore";

type SidebarTab = "ai" | "dashboard";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  placeholder?: boolean;
}

const dashboardItems: NavItem[] = [
  { title: "市场看板", url: "/tools/market", icon: BarChart3 },
  { title: "收益测算后台", url: "/tools/calculator", icon: Calculator },
  { title: "气象看板", url: "/tools/weather", icon: CloudSun },
  { title: "算法预测", url: "/tools/prediction", icon: LineChart },
  { title: "交易日历", url: "/tools/calendar", icon: Calendar },
  { title: "交易执行", url: "/tools/trading", icon: Zap, placeholder: true },
];

const pluginModules: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  url?: string;
  placeholder?: boolean;
}> = [
  {
    title: "交易同步助手",
    description: "浏览器侧栏模拟：采集、设置、任务调试",
    icon: Plug,
    url: "/system/plugin",
  },
  {
    title: "自动报价 / 自动售卖插件",
    description: "自动报价机器人 · On queue / 待排期",
    icon: History,
    placeholder: true,
  },
];

const tabConfig: { key: SidebarTab; label: string; icon: LucideIcon }[] = [
  { key: "ai", label: "听雨", icon: Bot },
  { key: "dashboard", label: "看板", icon: LayoutDashboard },
];

function getTabFromPath(pathname: string): SidebarTab {
  if (pathname.startsWith("/ai")) return "ai";
  return "dashboard";
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const [activeTab, setActiveTab] = useState<SidebarTab>(() => getTabFromPath(location.pathname));

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabClick = (tab: SidebarTab) => {
    setActiveTab(tab);
    if (tab === "ai") navigate("/ai/policy");
    else if (tab === "dashboard") navigate(dashboardItems[0].url);
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarContent className="p-0 flex flex-col items-stretch">
        {/* 一级 Tab */}
        <div className={`h-12 border-b flex items-stretch shrink-0 gap-1 py-1.5 ${collapsed ? "px-1" : "px-1.5"}`}>
          {tabConfig.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                title={tab.label}
                  className={`relative h-full rounded-md flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  active
                      ? collapsed
                        ? "w-9 bg-primary/10 text-primary"
                        : "flex-1 bg-primary/10 text-primary px-2"
                      : "w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                  {active && !collapsed && <span className="text-xs font-medium truncate">{tab.label}</span>}
              </button>
            );
          })}
        </div>

        {activeTab === "ai" ? (
          <AiPanel collapsed={collapsed} />
        ) : (
          <div className={`flex-1 min-h-0 py-2 flex flex-col gap-3 ${collapsed ? "px-1" : "px-2"}`}>
            <nav className="flex flex-col gap-0.5 overflow-auto">
            {dashboardItems.map((item) => {
              const isActive = !item.placeholder && location.pathname.startsWith(item.url);
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
                  className={`w-full h-9 flex items-center gap-2 px-2.5 rounded-md text-left transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : item.placeholder
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                    <span className={`text-[13px] leading-none truncate ${collapsed ? "hidden" : ""}`}>
                    {item.title}
                  </span>
                </button>
              );
            })}
            </nav>

            {!collapsed && <Card className="mt-auto rounded-md border-border/80 shadow-none bg-card/70 shrink-0">
              <CardHeader className="px-3 py-3 space-y-1.5">
                <CardTitle className="text-[12px] leading-none font-semibold text-foreground/90">
                  收益测算与交易同步
                </CardTitle>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  后台测算闭环与浏览器采集侧栏；SP3 自动报价保持 On queue。
                </p>
              </CardHeader>
              <CardContent className="px-2.5 pb-2.5 pt-0">
                <div className="flex flex-col gap-1.5">
                  {pluginModules.map((module) => {
                    const isActive = !!module.url && location.pathname.startsWith(module.url);
                    return (
                      <button
                        key={module.title}
                        onClick={() => module.url && navigate(module.url)}
                        disabled={module.placeholder}
                        className={`w-full rounded-md border px-2.5 py-2 text-left transition-colors ${
                          isActive
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : module.placeholder
                              ? "border-border/60 text-muted-foreground/55 cursor-not-allowed"
                              : "border-border/70 text-foreground/80 hover:bg-secondary/50 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <module.icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium leading-none truncate">{module.title}</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                              {module.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>}
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

// ============================================================
// 听雨面板：新建会话 + 历史政策入口 + 置顶/最近会话
// （历史政策列表已迁出到 /ai/policies 主工作区）
// ============================================================
function AiPanel({ collapsed = false }: { collapsed?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessions, togglePin, rename, remove, create } = useChatSessions();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [recentHover, setRecentHover] = useState(false);

  const pinnedSessions = useMemo(
    () =>
      [...sessions]
        .filter((s) => s.pinned)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [sessions]
  );
  const recentSessions = useMemo(
    () =>
      [...sessions]
        .filter((s) => !s.pinned)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6),
    [sessions]
  );

  const handleNewSession = () => {
    const sess = create("新建会话");
    navigate(`/ai/policy?sid=${sess.id}`);
  };

  const startRename = (id: string, current: string) => {
    setRenamingId(id);
    setRenameDraft(current);
  };
  const commitRename = () => {
    if (renamingId && renameDraft.trim()) rename(renamingId, renameDraft.trim());
    setRenamingId(null);
  };

  const policiesActive = location.pathname.startsWith("/ai/policies");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 新建会话（主按钮） */}
      <div className={`${collapsed ? "px-1" : "px-2"} py-2 border-b`}>
        <button
          onClick={handleNewSession}
          className="w-full flex items-center justify-center gap-1.5 h-9 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          {!collapsed && "新建会话"}
        </button>
      </div>

      {/* 布告栏（独立入口按钮） */}
      <div className={`${collapsed ? "px-1" : "px-2"} pt-2`}>
        <button
          onClick={() => navigate("/ai/policies")}
          title="布告栏"
          className={`w-full h-9 flex items-center gap-2 px-2.5 rounded-md text-left transition-colors ${
            policiesActive
              ? "bg-primary/10 text-primary font-medium"
              : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
          }`}
        >
          <Megaphone className={`h-4 w-4 shrink-0 ${policiesActive ? "text-primary" : ""}`} />
          {!collapsed && <span className="text-[13px] leading-none truncate flex-1">布告栏</span>}
        </button>
      </div>

      {/* 置顶会话 */}
      {!collapsed && pinnedSessions.length > 0 && (
        <div className="px-2 pt-3 pb-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 pb-1">
            置顶会话
          </p>
          <div className="flex flex-col gap-px">
            {pinnedSessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                renaming={renamingId === s.id}
                renameDraft={renameDraft}
                setRenameDraft={setRenameDraft}
                onCommitRename={commitRename}
                onStartRename={() => startRename(s.id, s.title)}
                onTogglePin={() => togglePin(s.id)}
                onRemove={() => remove(s.id)}
                onOpen={() => navigate(`/ai/policy?sid=${s.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 最近会话 + hover 显示 View All */}
      {!collapsed && <div
        className="px-2 pt-3 pb-2 mt-1 flex-1 min-h-0 flex flex-col"
        onMouseEnter={() => setRecentHover(true)}
        onMouseLeave={() => setRecentHover(false)}
      >
        <div className="flex items-center justify-between px-2 pb-1 shrink-0">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            最近会话
          </p>
          <button
            onClick={() => navigate("/ai/sessions")}
            className={`text-[10px] flex items-center gap-0.5 text-primary hover:underline transition-opacity ${
              recentHover ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            View All <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="flex-1 overflow-auto flex flex-col gap-px">
          {recentSessions.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/70 px-2 py-1">暂无</p>
          ) : (
            recentSessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                renaming={renamingId === s.id}
                renameDraft={renameDraft}
                setRenameDraft={setRenameDraft}
                onCommitRename={commitRename}
                onStartRename={() => startRename(s.id, s.title)}
                onTogglePin={() => togglePin(s.id)}
                onRemove={() => remove(s.id)}
                onOpen={() => navigate(`/ai/policy?sid=${s.id}`)}
              />
            ))
          )}
        </div>
      </div>}
    </div>
  );
}

// ---------- 会话行（含三点菜单：置顶/重命名/删除） ----------
interface SessionRowProps {
  session: { id: string; title: string; updatedAt: string; pinned: boolean };
  renaming: boolean;
  renameDraft: string;
  setRenameDraft: (v: string) => void;
  onCommitRename: () => void;
  onStartRename: () => void;
  onTogglePin: () => void;
  onRemove: () => void;
  onOpen: () => void;
}

function SessionRow({
  session: s,
  renaming,
  renameDraft,
  setRenameDraft,
  onCommitRename,
  onStartRename,
  onTogglePin,
  onRemove,
  onOpen,
}: SessionRowProps) {
  return (
    <div className="group relative flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-secondary/60">
      <button
        onClick={() => !renaming && onOpen()}
        className="flex-1 min-w-0 text-left flex flex-col gap-0.5"
        title={s.title}
      >
        {renaming ? (
          <input
            autoFocus
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            onBlur={onCommitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCommitRename();
            }}
            className="h-6 text-xs bg-background border rounded px-1.5 w-full"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <span className="text-[11px] leading-tight text-foreground/85 truncate">
              {s.title}
            </span>
            <span className="text-[10px] text-muted-foreground/70 tabular-nums">
              {new Date(s.updatedAt).toLocaleDateString("zh-CN", {
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
          </>
        )}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem onClick={onTogglePin}>
            {s.pinned ? (
              <>
                <PinOff className="h-3.5 w-3.5 mr-2" /> 取消置顶
              </>
            ) : (
              <>
                <Pin className="h-3.5 w-3.5 mr-2" /> 置顶
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onStartRename}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> 重命名
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onRemove}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" /> 删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
