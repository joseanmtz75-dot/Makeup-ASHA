import { SidebarDashboard } from "@/components/layout/SidebarDashboard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <SidebarDashboard />
      <main className="flex-1 overflow-auto bg-muted/20">{children}</main>
    </div>
  );
}
