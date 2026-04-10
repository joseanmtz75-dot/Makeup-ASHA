import { prisma } from "@/lib/prisma";
import { HistorialGanadoras } from "@/components/publico/HistorialGanadoras";
import { Trophy } from "lucide-react";

export const metadata = { title: "Historial de ganadoras" };
export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const dinamicas = await prisma.dinamica.findMany({
    where: {
      estatus: { in: ["GANADORA_SELECCIONADA", "ENTREGADA"] },
    },
    select: {
      id: true,
      nombre: true,
      tipo: true,
      precioBoleto: true,
      totalBoletos: true,
      estatus: true,
      boletoGanador: true,
      seedGanadora: true,
      hashSeed: true,
      sorteadoEn: true,
      entregadoEn: true,
      premioCustom: true,
      imagenPremioUrl: true,
      productoPremio: {
        select: {
          nombre: true,
          precio: true,
          imagenes: {
            select: { url: true },
            orderBy: { orden: "asc" as const },
            take: 1,
          },
        },
      },
      clientaGanadora: {
        select: { nombre: true, telefono: true },
      },
    },
    orderBy: { sorteadoEn: "desc" },
  });

  // Censurar datos personales
  const publico = dinamicas.map((d) => {
    const nombre = d.clientaGanadora?.nombre ?? "Participante";
    const tel = d.clientaGanadora?.telefono ?? "";
    const partes = nombre.split(" ");
    const alias =
      partes.length > 1 ? `${partes[0]} ${partes[1][0]}.` : partes[0];
    const telCensurado =
      tel.length === 10
        ? `${tel.slice(0, 2)} ** ** ${tel.slice(8)}`
        : "";

    return {
      id: d.id,
      nombre: d.nombre,
      tipo: d.tipo,
      precioBoleto: d.precioBoleto,
      totalBoletos: d.totalBoletos,
      boletoGanador: d.boletoGanador,
      premio: d.premioCustom ?? d.productoPremio?.nombre ?? "Premio",
      premioImagen:
        d.imagenPremioUrl ?? d.productoPremio?.imagenes[0]?.url ?? null,
      ganadora: alias,
      telefonoCensurado: telCensurado,
      sorteadoEn: d.sorteadoEn?.toISOString() ?? null,
      entregadoEn: d.entregadoEn?.toISOString() ?? null,
      verificacion: {
        hashSeed: d.hashSeed,
        seed: d.seedGanadora,
        dinamicaId: d.id,
        timestampSorteo: d.sorteadoEn?.toISOString() ?? null,
        totalBoletos: d.totalBoletos,
        numeroGanador: d.boletoGanador,
      },
    };
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-bold">
          <Trophy className="h-10 w-10 text-amber-500" />
          Ganadoras
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Todas las dinámicas son verificables. Cada resultado se puede
          comprobar con la semilla y el hash publicados.
        </p>
      </div>

      <HistorialGanadoras ganadoras={publico} />
    </div>
  );
}
