import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/getUserContext";
import { SidebarDashboard } from "@/components/layout/SidebarDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login");

  return (
    <div className="flex min-h-screen w-full">
      <SidebarDashboard role={ctx.role as "admin" | "operadora"} />
      <main className="flex-1 overflow-auto bg-muted/20 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
