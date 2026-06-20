// app/dashboard/layout.tsx
import { Sidebar } from "@/src/layout/widgets/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      {/* Sidebar (shared globally) */}
      <aside className="h-screen sticky top-0">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-5">
          {children}
        </div>
      </div>
    </div>
  );
}