
import Header from "./_components/Header";
import Sidebar from "./_components/Sidebar";

export default function DashboardLayout({
  children,
  userRole,
}: {
  children: React.ReactNode;
  userRole: string;
}) {

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-950">
      <Sidebar userRole={userRole} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userRole={userRole} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-200 dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}
