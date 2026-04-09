import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { buttonVariants } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { ClientasTable } from "@/components/clientas/ClientasTable";

export const metadata = { title: "Clientas" };

export default async function ClientasPage() {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard/clientas");

  const clientas = await prisma.clienta.findMany({
    include: {
      _count: { select: { compras: true } },
    },
    orderBy: { creadaEn: "desc" },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Users className="h-8 w-8 text-primary" />
            Clientas
          </h1>
          <p className="text-sm text-muted-foreground">
            {clientas.length}{" "}
            {clientas.length === 1 ? "clienta registrada" : "clientas registradas"}
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
    </div>
  );
}
