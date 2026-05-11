import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import OrderNotifier from "@/components/OrderNotifier";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 border-b border-base bg-surface/80 backdrop-blur flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2.5 pl-3 border-l border-base">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "rgb(var(--brand))" }}>A</span>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-base leading-none">Admin</p>
                <p className="text-[10px] text-muted leading-none mt-0.5">Cosy Corner</p>
              </div>
            </div>
          </div>
        </header>

        <OrderNotifier />

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full p-6 md:p-8 overflow-auto [&:has(.live-page)]:p-0 [&:has(.live-page)]:overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
