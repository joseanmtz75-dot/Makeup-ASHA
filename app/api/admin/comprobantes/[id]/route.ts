import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { z } from "zod";
import {
  apiOk,
  apiUnauthorized,
  apiNotFound,
  apiBadRequest,
  apiZodError,
  apiServerError,
} from "@/lib/api-response";
import { ZodError } from "zod";
import DOMPurify from "isomorphic-dompurify";

export const dynamic = "force-dynamic";

const validarSchema = z.object({
  decision: z.enum(["APROBADO", "RECHAZADO"]),
  notasValidacion: z.string().max(500).trim().optional().nullable(),
});

/**
 * PUT /api/admin/comprobantes/[id]
 * Aprobar o rechazar un comprobante.
 *
 * Si APROBADO:
 *   - Comprobante.estatus = APROBADO
 *   - Compra.estatus = PAGADO
 *   - Producto.stock -= cantidad (en transacción)
 *
 * Si RECHAZADO:
 *   - Comprobante.estatus = RECHAZADO
 *   - Compra.estatus se queda en PENDIENTE (admin debe contactar a la clienta)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  const { id } = await params;

  try {
    const body = await request.json();
    if (body.notasValidacion)
      body.notasValidacion = DOMPurify.sanitize(body.notasValidacion);

    const data = validarSchema.parse(body);

    const comprobante = await prisma.comprobante.findUnique({
      where: { id },
      include: {
        compra: { include: { producto: true } },
      },
    });

    if (!comprobante) return apiNotFound("Comprobante");

    if (comprobante.estatus !== "PENDIENTE") {
      return apiBadRequest("Este comprobante ya fue revisado");
    }

    if (data.decision === "APROBADO") {
      // Verificar stock disponible antes de aprobar
      if (
        comprobante.compra &&
        comprobante.compra.producto.stock < comprobante.compra.cantidad
      ) {
        return apiBadRequest(
          `No hay stock suficiente. Quedan ${comprobante.compra.producto.stock}, se necesitan ${comprobante.compra.cantidad}`
        );
      }

      await prisma.$transaction(async (tx) => {
        // 1. Marcar comprobante como aprobado
        await tx.comprobante.update({
          where: { id },
          data: {
            estatus: "APROBADO",
            validadoPor: ctx.userId,
            validadoEn: new Date(),
            notasValidacion: data.notasValidacion,
          },
        });

        // 2. Actualizar compra y bajar stock
        if (comprobante.compra) {
          await tx.compra.update({
            where: { id: comprobante.compra.id },
            data: { estatus: "PAGADO" },
          });

          await tx.producto.update({
            where: { id: comprobante.compra.productoId },
            data: {
              stock: { decrement: comprobante.compra.cantidad },
            },
          });
        }
      });
    } else {
      // RECHAZADO
      await prisma.comprobante.update({
        where: { id },
        data: {
          estatus: "RECHAZADO",
          validadoPor: ctx.userId,
          validadoEn: new Date(),
          notasValidacion: data.notasValidacion,
        },
      });
    }

    return apiOk({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    console.error("[PUT /api/admin/comprobantes/[id]]", error);
    return apiServerError();
  }
}
