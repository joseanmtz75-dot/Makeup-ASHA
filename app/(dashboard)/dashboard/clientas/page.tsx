import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { buttonVariants } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { ClientasTable } from "@/components/clientas/ClientasTable";
import { Pagination } from "@/components/ui/pagination";

export const metadata = { title: "Clientas" };

const PAGE_SIZE = 25;

export default async function ClientasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard/clientas");

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const [clientas, total] = await Promise.all([
    prisma.clienta.findMany({
      include: {
        _count: { select: { compras: true } },
      },
      orderBy: { creadaEn: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.clienta.count(),
  ]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Users className="h-8 w-8 text-primary" />
            Clientas
          </h1>
          <p className="text-sm text-muted-foreground">
            {total}{" "}
            {total === 1 ? "clienta registrada" : "clientas registradas"}
          </p>
        </div>

        <Link
          href="/dashboard/clientas/nueva"
          className={buttonVariants({ size: "lg" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva clienta
        </Link>
      </div>

      <ClientasTable clientas={clientas} esAdmin={ctx.role === "admin"} />
      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
    </div>
  );
}
