import { ReactNode } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { ArrowLeft, Users, Calculator as CalcIcon, FileCog, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  to: string;
  label: string;
  icon: typeof Users;
  desc: string;
}

const tabs: Tab[] = [
  { to: "/tools/calculator/customers", label: "客户与套餐", icon: Users, desc: "客户档案与套餐版本绑定" },
  { to: "/tools/calculator/runs", label: "计算任务", icon: CalcIcon, desc: "试算 / 正式核算与结果" },
  { to: "/tools/calculator/policies", label: "政策参数版本", icon: FileCog, desc: "结算政策版本管理" },
  { to: "/tools/calculator/batches", label: "数据版本", icon: Database, desc: "插件采集与计算输入追溯" },
];

interface CalculatorShellProps {
  children: ReactNode;
  /** 是否是结果页等深层页面，需要『返回上一级』而不是回到看板 */
  inner?: boolean;
}

export function CalculatorShell({ children, inner = false }: CalculatorShellProps) {
  const nav = useNavigate();
  const location = useLocation();

  // 当前激活 tab：优先按前缀匹配（兼容 runs/:id/results 这类深层路由）
  const activeTab =
    tabs.find((t) => location.pathname === t.to) ||
    tabs.find((t) => location.pathname.startsWith(t.to));

  const handleBack = () => {
    if (inner) {
      // 深层（如计算结果）回到所属 tab 列表页
      if (location.pathname.startsWith("/tools/calculator/runs/")) {
        nav("/tools/calculator/runs");
        return;
      }
    }
    // 默认：回到结算计算器入口（即客户列表，作为默认首屏）
    nav("/tools/calculator");
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* 顶部：返回 + 当前模块标题 + 简述 */}
      <div className="border-b bg-card/40 px-6 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            title={inner ? "返回上一级" : "返回结算计算器首页"}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回
          </button>
          <span className="text-xs text-muted-foreground">
            结算计算器{activeTab ? ` / ${activeTab.label}` : ""}
          </span>
        </div>
        {activeTab && (
          <div className="flex items-baseline gap-3">
            <h1 className="text-base font-semibold">{activeTab.label}</h1>
            <p className="text-xs text-muted-foreground">{activeTab.desc}</p>
          </div>
        )}

        {/* 模块 tabs（横向分段） */}
        <nav className="mt-3 flex items-center gap-1 -mb-px">
          {tabs.map((t) => {
            const isActive = activeTab?.to === t.to;
            const Icon = t.icon;
            return (
              <NavLink
                key={t.to}
                to={t.to}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 min-w-0 overflow-auto">{children}</div>
    </div>
  );
}
