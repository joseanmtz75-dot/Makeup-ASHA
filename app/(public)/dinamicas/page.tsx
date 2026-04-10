import { prisma } from "@/lib/prisma";
import { DinamicasFeed } from "@/components/publico/DinamicasFeed";
import { Ticket } from "lucide-react";

export const metadata = { title: "Dinámicas" };
export const dynamic = "force-dynamic";

export default async function DinamicasPublicasPage() {
  const dinamicas = await prisma.dinamica.findMany({
    where: {
      estatus: { in: ["ACTIVA", "LLENA"] },
    },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      tipo: true,
      precioBoleto: true,
      totalBoletos: true,
      estatus: true,
      inicioEn: true,
      cierreEn: true,
      imagenPremioUrl: true,
      premioCustom: true,
      productoPremio: {
        select: {
          id: true,
          nombre: true,
          precio: true,
          imagenes: {
            select: { url: true },
            orderBy: { orden: "asc" as const },
            take: 1,
          },
        },
      },
      _count: {
        select: {
          boletos: { where: { estatus: "CONFIRMADO" } },
        },
      },
    },
    orderBy: { inicioEn: "desc" },
  });

  const conProgreso = dinamicas.map((d) => ({
    ...d,
    boletosVendidos: d._count.boletos,
    boletosDisponibles: d.totalBoletos - d._count.boletos,
  }));

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-bold">
          <Ticket className="h-10 w-10 text-primary" />
          Dinámicas
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Elige tu número de la suerte y participa. Cada boleto es una
          oportunidad de ganar.
        </p>
      </div>

      <DinamicasFeed
        dinamicas={JSON.parse(JSON.stringify(conProgreso))}
      />
    </div>
  );
}
