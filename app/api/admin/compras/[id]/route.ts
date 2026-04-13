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
import { sanitize } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  estatus: z
    .enum(["PENDIENTE", "PAGADO", "LISTO_ENTREGA", "ENTREGADO", "CANCELADO"])
    .optional(),
  notasAdmin: z.string().max(500).trim().optional().nullable(),
});

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  PENDIENTE: ["PAGADO", "CANCELADO"],
  PAGADO: ["LISTO_ENTREGA", "CANCELADO"],
  LISTO_ENTREGA: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  const { id } = await params;

  try {
    const body = await request.json();
    if (body.notasAdmin) body.notasAdmin = sanitize(body.notasAdmin);

    const data = updateSchema.parse(body);

    const compra = await prisma.compra.findUnique({
      where: { id },
      include: { producto: true },
    });
    if (!compra) return apiNotFound("Compra");

    // Validar transición de estatus
    if (data.estatus && data.estatus !== compra.estatus) {
      const validas = TRANSICIONES_VALIDAS[compra.estatus] || [];
      if (!validas.includes(data.estatus)) {
        return apiBadRequest(
          `No se puede pasar de ${compra.estatus} a ${data.estatus}`
        );
      }

      // Si se cancela una compra ya pagada, devolver stock
      if (data.estatus === "CANCELADO" && compra.estatus !== "PENDIENTE") {
        await prisma.$transaction(async (tx) => {
          await tx.compra.update({
            where: { id },
            data: {
              estatus: "CANCELADO",
              canceladaEn: new Date(),
              ...(data.notasAdmin !== undefined && {
                notasAdmin: data.notasAdmin,
              }),
            },
          });
          await tx.producto.update({
            where: { id: compra.productoId },
            data: { stock: { increment: compra.cantidad } },
          });
        });
        return apiOk({ ok: true, stockDevuelto: compra.cantidad });
      }
    }

    const actualizada = await prisma.compra.update({
      where: { id },
      data: {
        ...(data.estatus !== undefined && { estatus: data.estatus }),
        ...(data.notasAdmin !== undefined && { notasAdmin: data.notasAdmin }),
        ...(data.estatus === "ENTREGADO" && { entregadaEn: new Date() }),
      },
    });

    return apiOk(actualizada);
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    console.error("[PUT /api/admin/compras/[id]]", error);
    return apiServerError();
  }
}
