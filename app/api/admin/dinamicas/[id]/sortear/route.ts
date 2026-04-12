import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import {
  apiOk,
  apiUnauthorized,
  apiNotFound,
  apiServerError,
  apiBadRequest,
} from "@/lib/api-response";
import { calcularGanador } from "@/lib/utils/sortearGanadora";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/dinamicas/[id]/sortear
 * Ejecuta el algoritmo de selección de ganadora.
 * Solo admin. Valida que todos los boletos estén CONFIRMADO.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return apiUnauthorized();

  const { id } = await params;

  try {
    const dinamica = await prisma.dinamica.findUnique({
      where: { id },
      include: {
        boletos: {
          select: {
            id: true,
            numero: true,
            estatus: true,
            clientaId: true,
            clienta: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    if (!dinamica) return apiNotFound("Dinámica");

    if (dinamica.estatus !== "LLENA") {
      return apiBadRequest(
        "La dinámica debe estar en estado Llena para poder seleccionar ganadora"
      );
    }

    if (!dinamica.seedGanadora) {
      return apiBadRequest("La dinámica no tiene seed asignada");
    }

    // Validar que TODOS los boletos estén confirmados
    const boletosConfirmados = dinamica.boletos.filter(
      (b) => b.estatus === "CONFIRMADO"
    );
    if (boletosConfirmados.length !== dinamica.totalBoletos) {
      return apiBadRequest(
        `Faltan boletos por confirmar: ${boletosConfirmados.length}/${dinamica.totalBoletos} confirmados`
      );
    }

    // Ejecutar algoritmo de selección
    // Formato fijo sin milisegundos para que la verificación sea reproducible
    const ahora = new Date();
    ahora.setMilliseconds(0);
    const timestampSorteo = ahora.toISOString(); // "2026-04-12T14:32:45.000Z"
    const numeroGanador = calcularGanador(
      dinamica.seedGanadora,
      dinamica.id,
      timestampSorteo,
      dinamica.totalBoletos
    );

    // Encontrar el boleto ganador
    const boletoGanador = dinamica.boletos.find(
      (b) => b.numero === numeroGanador
    );
    if (!boletoGanador || !boletoGanador.clientaId) {
      return apiServerError();
    }

    // Actualizar la dinámica
    const resultado = await prisma.$transaction(async (tx) => {
      const actualizada = await tx.dinamica.update({
        where: { id },
        data: {
          estatus: "GANADORA_SELECCIONADA",
          boletoGanador: numeroGanador,
          clientaGanadoraId: boletoGanador.clientaId,
          sorteadoEn: timestampSorteo,
        },
        include: {
          clientaGanadora: {
            select: { id: true, nombre: true, telefono: true },
          },
          productoPremio: {
            select: { id: true, nombre: true },
          },
        },
      });

      await tx.historialDinamica.create({
        data: {
          dinamicaId: id,
          estatusAnterior: "LLENA",
          estatusNuevo: "GANADORA_SELECCIONADA",
          userId: ctx.userId,
          notas: `Número ganador: ${numeroGanador}. Ganadora: ${boletoGanador.clienta?.nombre}`,
        },
      });

      return actualizada;
    });

    return apiOk({
      dinamica: resultado,
      sorteo: {
        numeroGanador,
        timestampSorteo,
        seed: dinamica.seedGanadora,
        hashSeed: dinamica.hashSeed,
      },
    });
  } catch (error) {
    console.error("[POST /api/admin/dinamicas/[id]/sortear]", error);
    return apiServerError();
  }
}
