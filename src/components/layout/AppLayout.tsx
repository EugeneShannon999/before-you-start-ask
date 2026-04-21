import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
import { P1Ticker } from "@/components/messages/P1Ticker";
import { P0Alert } from "@/components/messages/P0Alert";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "8.5rem",
          "--sidebar-width-icon": "8.5rem",
        } as React.CSSProperties
      }
    >
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppTopBar />
          {/* P1 全局横条 - Tab 栏下方、主内容上方 */}
          <P1Ticker />
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
