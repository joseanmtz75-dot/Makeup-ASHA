import { prisma } from "@/lib/prisma";
import { apiOk, apiServerError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/historial-ganadoras
 * Lista pública de dinámicas cerradas con ganadoras.
 * Incluye datos para verificación criptográfica.
 * Protección de datos: nombre + inicial de apellido, sin teléfono.
 */
export async function GET() {
  try {
    const dinamicas = await prisma.dinamica.findMany({
      where: {
        estatus: { in: ["GANADORA_SELECCIONADA", "ENTREGADA"] },
        clientaGanadoraId: { not: null },
      },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        precioBoleto: true,
        totalBoletos: true,
        estatus: true,
        esHistorico: true,
        boletoGanador: true,
        seedGanadora: true,
        hashSeed: true,
        sorteadoEn: true,
        entregadoEn: true,
        creadoEn: true,
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
      orderBy: [{ sorteadoEn: "desc" }, { creadoEn: "desc" }],
    });

    // Censurar datos personales para vista pública
    const publico = dinamicas.map((d) => {
      const nombre = d.clientaGanadora?.nombre ?? "Participante";
      const tel = d.clientaGanadora?.telefono ?? "";
      // "Karla M." + "33 ** ** 89"
      const partes = nombre.split(" ");
      const alias =
        partes.length > 1
          ? `${partes[0]} ${partes[1][0]}.`
          : partes[0];
      const telCensurado = tel.length === 10
        ? `${tel.slice(0, 2)} ** ** ${tel.slice(8)}`
        : "";

      return {
        id: d.id,
        nombre: d.nombre,
        tipo: d.tipo,
        esHistorico: d.esHistorico,
        precioBoleto: d.precioBoleto,
        totalBoletos: d.totalBoletos,
        estatus: d.estatus,
        boletoGanador: d.boletoGanador,
        premio: d.premioCustom ?? d.productoPremio?.nombre ?? "Premio",
        premioImagen:
          d.imagenPremioUrl ?? d.productoPremio?.imagenes[0]?.url ?? null,
        ganadora: alias,
        telefonoCensurado: telCensurado,
        sorteadoEn: d.sorteadoEn,
        entregadoEn: d.entregadoEn,
        // Datos de verificación
        verificacion: {
          hashSeed: d.hashSeed,
          seed: d.seedGanadora,
          dinamicaId: d.id,
          timestampSorteo: d.sorteadoEn,
          totalBoletos: d.totalBoletos,
          numeroGanador: d.boletoGanador,
        },
      };
    });

    return apiOk(publico);
  } catch (error) {
    console.error("[GET /api/historial-ganadoras]", error);
    return apiServerError();
  }
}
