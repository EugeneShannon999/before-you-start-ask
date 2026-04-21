import { ReactNode } from "react";

// ============================================================
// 三栏工作台布局壳 (Workbench Layout)
// ------------------------------------------------------------
// 结构：[ 全局侧栏 (AppLayout) ] | 中栏控制区 | 右栏主工作区
//
// 比例（桌面端）：
//   - 中栏：1440+ 固定 360px；1280-1439 收到 320px；<1200 折叠到右栏上方
//   - 右栏：自适应剩余宽度，最小 760px
//   - 中栏与右栏间距：32px (gap-8)
//   - 左栏与中栏间距：24px (由 AppLayout 主容器 padding 承担)
//
// 行为：
//   - 中栏 sticky top-0，整体可滚动时保持可见
//   - 顶部对齐（中栏第一个卡片 顶 = 右栏第一个卡片 顶）
//   - 整页竖向滚动以右栏为主，中栏在自身高度内独立滚动
// ============================================================

interface WorkbenchLayoutProps {
  /** 中栏控制区内容（标题 / 筛选 / 步骤 / 配置 / 状态） */
  middle: ReactNode;
  /** 右栏主工作区内容（图表 / 表格 / 对话） */
  children: ReactNode;
  /** 中栏宽度档位，默认 standard (1440+ 360px) */
  middleSize?: "compact" | "standard";
  /** 是否禁用整页滚动（用于全屏对话页等需要内部独立滚动的场景） */
  fixedHeight?: boolean;
}

export function WorkbenchLayout({
  middle,
  children,
  middleSize = "standard",
  fixedHeight = false,
}: WorkbenchLayoutProps) {
  const middleWidth =
    middleSize === "compact"
      ? "xl:w-[320px] 2xl:w-[340px]"
      : "xl:w-[340px] 2xl:w-[360px]";

  return (
    <div
      className={[
        "flex flex-col xl:flex-row gap-6 xl:gap-8 px-6 py-5",
        fixedHeight ? "h-[calc(100vh-5rem)] overflow-hidden" : "min-h-[calc(100vh-5rem)]",
      ].join(" ")}
    >
      {/* 中栏：控制 / 步骤 / 状态（不独立滚动，跟随整页滚动） */}
      <aside
        className={[
          "shrink-0 w-full",
          middleWidth,
          fixedHeight ? "xl:h-full xl:overflow-y-auto" : "",
          "space-y-3",
        ].join(" ")}
      >
        {middle}
      </aside>

      {/* 右栏：主工作区 */}
      <section
        className={[
          "flex-1 min-w-0 xl:min-w-[760px]",
          fixedHeight ? "h-full overflow-y-auto" : "",
          "space-y-3",
        ].join(" ")}
      >
        {children}
      </section>
    </div>
  );
}

// ---------- 中栏卡片：用于把控制区内容分块 ----------
interface WorkbenchPanelProps {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 紧凑卡片，p-3 而不是 p-4 */
  compact?: boolean;
}

export function WorkbenchPanel({
  title,
  action,
  children,
  className,
  compact,
}: WorkbenchPanelProps) {
  return (
    <div
      className={[
        "rounded-lg border bg-card shadow-notion",
        compact ? "p-3" : "p-4",
        className ?? "",
      ].join(" ")}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-2.5">
          {title && (
            <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wider">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
