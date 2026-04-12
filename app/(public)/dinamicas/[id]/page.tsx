import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DinamicaPublica } from "@/components/publico/DinamicaPublica";
import { RESERVA_TIMEOUT_MINUTOS } from "@/lib/constants/dinamicas";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dinamica = await prisma.dinamica.findUnique({
    where: { id },
    select: { nombre: true, descripcion: true },
  });

  return {
    title: dinamica?.nombre ?? "Dinámica",
    description: dinamica?.descripcion ?? undefined,
  };
}

export default async function DinamicaPublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dinamica = await prisma.dinamica.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      tipo: true,
      precioBoleto: true,
      totalBoletos: true,
      estatus: true,
      hashSeed: true,
      seedGanadora: true,
      boletoGanador: true,
      sorteadoEn: true,
      inicioEn: true,
      cierreEn: true,
      imagenPremioUrl: true,
      premioCustom: true,
      productoPremio: {
        select: {
          id: true,
          nombre: true,
          precio: true,
          descripcion: true,
          imagenes: {
            select: { url: true },
            orderBy: { orden: "asc" as const },
          },
        },
      },
      clientaGanadora: {
        select: { nombre: true },
      },
      boletos: {
        select: {
          numero: true,
          estatus: true,
          reservadoEn: true,
        },
        orderBy: { numero: "asc" },
      },
    },
  });

  if (!dinamica || dinamica.estatus === "BORRADOR") {
    notFound();
  }

  // Ocultar seed si aún no se sortea
  const seedPublica =
    dinamica.estatus === "GANADORA_SELECCIONADA" ||
    dinamica.estatus === "ENTREGADA"
      ? dinamica.seedGanadora
      : null;

  // Limpiar reservas expiradas en DB (on-read cleanup)
  const ahora = new Date();
  const timeoutMs = RESERVA_TIMEOUT_MINUTOS * 60 * 1000;
  const fechaLimite = new Date(ahora.getTime() - timeoutMs);

  // Liberar boletos RESERVADO que pasaron el timeout (escritura real en DB)
  await prisma.boleto.updateMany({
    where: {
      dinamicaId: id,
      estatus: "RESERVADO",
      reservadoEn: { lt: fechaLimite },
    },
    data: {
      estatus: "DISPONIBLE",
      clientaId: null,
      nombreCliente: null,
      telefonoCliente: null,
      comprobanteId: null,
      reservadoEn: null,
    },
  });

  // Re-mapear boletos para la vista (por si el updateMany no procesó alguno en el mismo tick)
  const boletosPublicos = dinamica.boletos.map((b) => {
    if (
      b.estatus === "RESERVADO" &&
      b.reservadoEn &&
      new Date(b.reservadoEn).getTime() < fechaLimite.getTime()
    ) {
      return { numero: b.numero, estatus: "DISPONIBLE" as const };
    }
    return { numero: b.numero, estatus: b.estatus };
  });

  const data = {
    ...dinamica,
    seedGanadora: seedPublica,
    boletos: boletosPublicos,
    ganadora: dinamica.clientaGanadora?.nombre ?? null,
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <DinamicaPublica dinamica={JSON.parse(JSON.stringify(data))} />
    </div>
  );
}
