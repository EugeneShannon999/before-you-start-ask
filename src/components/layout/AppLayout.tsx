import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
import { P0Alert } from "@/components/messages/P0Alert";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "15rem", // 240px - 全局导航栏宽度
          "--sidebar-width-icon": "15rem",
        } as React.CSSProperties
      }
    >
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppTopBar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      {/* P0 紧急消息弹窗 - 全局挂载 */}
      <P0Alert />
    </SidebarProvider>
  );
}
