import { SidebarProvider } from "@acme/ui/sidebar";

import Header from "./_components/Header";
import AppSidebar from "./_components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-slate-950">
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-200 dark:bg-slate-900">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
