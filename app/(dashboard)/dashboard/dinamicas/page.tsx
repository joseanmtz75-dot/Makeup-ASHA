import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/getUserContext";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { DinamicasTable } from "@/components/dinamicas/DinamicasTable";
import { Ticket, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DinamicasPage() {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard/dinamicas");

  const dinamicas = await prisma.dinamica.findMany({
    include: {
      productoPremio: {
        select: { id: true, nombre: true, precio: true },
      },
      clientaGanadora: {
        select: { id: true, nombre: true },
      },
      _count: {
        select: { boletos: { where: { estatus: "CONFIRMADO" } } },
      },
    },
    orderBy: { creadoEn: "desc" },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Ticket className="h-8 w-8 text-primary" />
            Dinámicas
          </h1>
          <p className="text-sm text-muted-foreground">
            {dinamicas.length}{" "}
            {dinamicas.length === 1 ? "dinámica" : "dinámicas"}
          </p>
        </div>

        {ctx.role === "admin" && (
          <Link
            href="/dashboard/dinamicas/nueva"
            className={buttonVariants()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva dinámica
          </Link>
        )}
      </div>

      <DinamicasTable
        dinamicas={JSON.parse(JSON.stringify(dinamicas))}
        esAdmin={ctx.role === "admin"}
      />
    </div>
  );
}
