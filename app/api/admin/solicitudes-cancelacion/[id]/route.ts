import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { revisarCancelacionSchema } from "@/lib/validations/cancelacion";
import {
  apiOk,
  apiUnauthorized,
  apiNotFound,
  apiZodError,
  apiServerError,
  apiBadRequest,
} from "@/lib/api-response";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/solicitudes-cancelacion/[id]
 * Aprobar o rechazar solicitud de cancelación. Admin u operadora.
 * Si se aprueba un boleto: vuelve a DISPONIBLE.
 * Si se rechaza un boleto: vuelve a CONFIRMADO.
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
    const data = revisarCancelacionSchema.parse(body);

    const solicitud = await prisma.solicitudCancelacion.findUnique({
      where: { id },
      include: {
        boleto: {
          include: { dinamica: { select: { estatus: true } } },
        },
      },
    });
    if (!solicitud) return apiNotFound("Solicitud de cancelación");

    if (solicitud.estatus !== "PENDIENTE") {
      return apiBadRequest("Esta solicitud ya fue revisada");
    }

    // Si se aprueba, validar que se incluya monto y método
    if (data.estatus === "APROBADA") {
      if (data.montoDevolucion === undefined || data.montoDevolucion === null) {
        return apiBadRequest("Se requiere monto de devolución al aprobar");
      }
      if (!data.metodoDevolucion) {
        return apiBadRequest("Se requiere método de devolución al aprobar");
      }
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar la solicitud
      const actualizada = await tx.solicitudCancelacion.update({
        where: { id },
        data: {
          estatus: data.estatus,
          revisadaPor: ctx.userId,
          revisadaEn: new Date(),
          notasAdmin: data.notasAdmin,
          montoDevolucion: data.estatus === "APROBADA" ? data.montoDevolucion : null,
          metodoDevolucion: data.estatus === "APROBADA" ? data.metodoDevolucion : null,
        },
      });

      // Efecto en el boleto o compra
      if (solicitud.tipoOrigen === "BOLETO" && solicitud.boletoId) {
        if (data.estatus === "APROBADA") {
          // Boleto vuelve a DISPONIBLE para que otra clienta pueda comprarlo
          await tx.boleto.update({
            where: { id: solicitud.boletoId },
            data: {
              estatus: "DISPONIBLE",
              clientaId: null,
              nombreCliente: null,
              telefonoCliente: null,
              comprobanteId: null,
              reservadoEn: null,
              confirmadoEn: null,
              canceladoEn: new Date(),
            },
          });

          // Si la dinámica estaba LLENA, regresa a ACTIVA
          if (solicitud.boleto?.dinamica?.estatus === "LLENA") {
            await tx.dinamica.update({
              where: { id: solicitud.boleto.dinamicaId },
              data: { estatus: "ACTIVA" },
            });
            await tx.historialDinamica.create({
              data: {
                dinamicaId: solicitud.boleto.dinamicaId,
                estatusAnterior: "LLENA",
                estatusNuevo: "ACTIVA",
                userId: ctx.userId,
                notas: "Boleto cancelado — dinámica reabierta",
              },
            });
          }
        } else {
          // Rechazada: boleto vuelve a CONFIRMADO (quitar flag de cancelación solicitada)
          await tx.boleto.update({
            where: { id: solicitud.boletoId },
            data: { estatus: "CONFIRMADO" },
          });
        }
      }

      if (solicitud.tipoOrigen === "COMPRA" && solicitud.compraId) {
        if (data.estatus === "APROBADA") {
          // Cancelar la compra y devolver stock
          const compra = await tx.compra.findUnique({
            where: { id: solicitud.compraId },
          });
          if (compra) {
            await tx.compra.update({
              where: { id: solicitud.compraId },
              data: { estatus: "CANCELADO", canceladaEn: new Date() },
            });
            // Devolver stock
            await tx.producto.update({
              where: { id: compra.productoId },
              data: { stock: { increment: compra.cantidad } },
            });
          }
        }
        // Si se rechaza, no se hace nada (la compra sigue igual)
      }

      return actualizada;
    });

    return apiOk(resultado);
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    console.error("[PUT /api/admin/solicitudes-cancelacion/[id]]", error);
    return apiServerError();
  }
}
