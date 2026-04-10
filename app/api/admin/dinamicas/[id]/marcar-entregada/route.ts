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

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/dinamicas/[id]/marcar-entregada
 * Marca la dinámica como entregada después de dar el premio.
 * Solo admin.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return apiUnauthorized();

  const { id } = await params;

  try {
    const dinamica = await prisma.dinamica.findUnique({ where: { id } });
    if (!dinamica) return apiNotFound("Dinámica");

    if (dinamica.estatus !== "GANADORA_SELECCIONADA") {
      return apiBadRequest(
        "La dinámica debe tener ganadora seleccionada para marcar como entregada"
      );
    }

    const actualizada = await prisma.$transaction(async (tx) => {
      const result = await tx.dinamica.update({
        where: { id },
        data: {
          estatus: "ENTREGADA",
          entregadoEn: new Date(),
        },
      });

      await tx.historialDinamica.create({
        data: {
          dinamicaId: id,
          estatusAnterior: "GANADORA_SELECCIONADA",
          estatusNuevo: "ENTREGADA",
          userId: ctx.userId,
          notas: "Premio entregado",
        },
      });

      return result;
    });

    return apiOk(actualizada);
  } catch (error) {
    console.error(
      "[POST /api/admin/dinamicas/[id]/marcar-entregada]",
      error
    );
    return apiServerError();
  }
}
