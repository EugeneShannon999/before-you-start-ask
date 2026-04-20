import { NavLink, useLocation } from "react-router-dom";
import { ReactNode, useState } from "react";
import {
  Users,
  Calculator as CalcIcon,
  Settings,
  ChevronDown,
  ChevronRight,
  FileCog,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Users;
}

interface NavGroup {
  key: string;
  label: string;
  icon: typeof Users;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    key: "customers",
    label: "客户与套餐",
    icon: Users,
    items: [{ to: "/tools/calculator/customers", label: "客户列表", icon: Users }],
  },
  {
    key: "runs",
    label: "计算",
    icon: CalcIcon,
    items: [{ to: "/tools/calculator/runs", label: "计算任务", icon: CalcIcon }],
  },
  {
    key: "system",
    label: "系统管理",
    icon: Settings,
    items: [
      { to: "/tools/calculator/policies", label: "政策参数版本", icon: FileCog },
      { to: "/tools/calculator/batches", label: "数据批次", icon: Database },
    ],
  },
];

interface CalculatorLayoutProps {
  children: ReactNode;
}

export function CalculatorLayout({ children }: CalculatorLayoutProps) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    customers: true,
    runs: true,
    system: true,
  });

  const toggle = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex min-h-full">
      {/* 二级侧边栏 */}
      <aside className="w-52 shrink-0 border-r bg-card/50">
        <div className="px-4 py-4 border-b">
          <h2 className="text-sm font-semibold">结算计算器</h2>
          <p className="text-xs text-muted-foreground mt-0.5">电力零售结算与收益</p>
        </div>
        <nav className="p-2 space-y-1">
          {groups.map((group) => {
            const isOpen = openGroups[group.key];
            const GroupIcon = group.icon;
            return (
              <div key={group.key}>
                <button
                  onClick={() => toggle(group.key)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <GroupIcon className="h-3.5 w-3.5" />
                  <span>{group.label}</span>
                </button>
                {isOpen && (
                  <div className="ml-2 mt-0.5 space-y-0.5">
                    {group.items.map((item) => {
                      const active =
                        location.pathname === item.to ||
                        (item.to === "/tools/calculator/runs" &&
                          location.pathname.startsWith("/tools/calculator/runs"));
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={cn(
                            "flex items-center gap-2 pl-6 pr-2 py-1.5 rounded-md text-sm transition-colors",
                            active
                              ? "bg-secondary text-primary font-medium"
                              : "text-foreground/80 hover:bg-secondary/60"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {item.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* 主内容 */}
      <div className="flex-1 min-w-0 overflow-auto">{children}</div>
    </div>
  );
}
