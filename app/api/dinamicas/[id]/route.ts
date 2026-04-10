import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiOk,
  apiNotFound,
  apiServerError,
  apiBadRequest,
} from "@/lib/api-response";
import { RESERVA_TIMEOUT_MINUTOS } from "@/lib/constants/dinamicas";

export const dynamic = "force-dynamic";

/**
 * GET /api/dinamicas/[id]
 * Detalle público de dinámica con mapa de boletos.
 * No devuelve datos personales de clientas.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
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
        inicioEn: true,
        cierreEn: true,
        imagenPremioUrl: true,
        premioCustom: true,
        // Solo mostrar seed si ya se seleccionó ganadora (transparencia)
        seedGanadora: true,
        boletoGanador: true,
        sorteadoEn: true,
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

    if (!dinamica) return apiNotFound("Dinámica");

    // No mostrar dinámicas en borrador al público
    if (dinamica.estatus === "BORRADOR") {
      return apiBadRequest("Esta dinámica aún no está disponible");
    }

    // Ocultar seed si aún no se sortea
    const seedPublica =
      dinamica.estatus === "GANADORA_SELECCIONADA" ||
      dinamica.estatus === "ENTREGADA"
        ? dinamica.seedGanadora
        : null;

    // Limpiar reservas expiradas (check on-read)
    const ahora = new Date();
    const timeoutMs = RESERVA_TIMEOUT_MINUTOS * 60 * 1000;

    const boletosPublicos = dinamica.boletos.map((b) => {
      // Si está reservado y pasó el timeout, mostrarlo como disponible
      if (
        b.estatus === "RESERVADO" &&
        b.reservadoEn &&
        ahora.getTime() - new Date(b.reservadoEn).getTime() > timeoutMs
      ) {
        return { numero: b.numero, estatus: "DISPONIBLE" as const };
      }
      return { numero: b.numero, estatus: b.estatus };
    });

    return apiOk({
      ...dinamica,
      seedGanadora: seedPublica,
      boletos: boletosPublicos,
      ganadora: dinamica.clientaGanadora?.nombre ?? null,
    });
  } catch (error) {
    console.error("[GET /api/dinamicas/[id]]", error);
    return apiServerError();
  }
}
