import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { solicitudCancelacionSchema } from "@/lib/validations/cancelacion";
import {
  apiOk,
  apiBadRequest,
  apiServerError,
  apiZodError,
  apiRateLimited,
} from "@/lib/api-response";
import { checkCsrf, csrfError } from "@/lib/csrf";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ZodError } from "zod";
import DOMPurify from "isomorphic-dompurify";

export const dynamic = "force-dynamic";

/**
 * POST /api/solicitudes-cancelacion
 * Clienta solicita cancelación de boleto o compra.
 * No cancela directamente — queda en cola para revisión admin.
 */
export async function POST(request: NextRequest) {
  if (!checkCsrf(request)) return csrfError();

  const ip = getClientIp(request);
  if (!checkRateLimit(`cancelacion:${ip}`, 5, 60 * 60 * 1000)) {
    return apiRateLimited();
  }

  try {
    const body = await request.json();

    if (body.motivo) body.motivo = DOMPurify.sanitize(body.motivo);

    const data = solicitudCancelacionSchema.parse(body);

    // Buscar clienta por teléfono
    const clienta = await prisma.clienta.findUnique({
      where: { telefono: data.telefono },
    });
    if (!clienta) {
      return apiBadRequest("No encontramos una clienta con ese teléfono");
    }

    // Validar que el boleto o compra exista y le pertenezca
    if (data.tipoOrigen === "BOLETO" && data.boletoId) {
      const boleto = await prisma.boleto.findUnique({
        where: { id: data.boletoId },
        include: { dinamica: { select: { estatus: true } } },
      });
      if (!boleto) return apiBadRequest("Boleto no encontrado");
      if (boleto.clientaId !== clienta.id) {
        return apiBadRequest("Ese boleto no te pertenece");
      }
      if (boleto.estatus !== "CONFIRMADO" && boleto.estatus !== "PENDIENTE_VALIDACION") {
        return apiBadRequest("Solo se puede solicitar cancelación de boletos confirmados o pendientes");
      }
      if (
        boleto.dinamica.estatus === "GANADORA_SELECCIONADA" ||
        boleto.dinamica.estatus === "ENTREGADA"
      ) {
        return apiBadRequest(
          "No se pueden cancelar boletos de una dinámica que ya tiene ganadora"
        );
      }

      // Verificar que no haya solicitud pendiente
      const solicitudExistente = await prisma.solicitudCancelacion.findFirst({
        where: {
          boletoId: data.boletoId,
          estatus: "PENDIENTE",
        },
      });
      if (solicitudExistente) {
        return apiBadRequest("Ya tienes una solicitud de cancelación pendiente para este boleto");
      }

      // Marcar boleto como cancelación solicitada
      await prisma.boleto.update({
        where: { id: data.boletoId },
        data: { estatus: "CANCELACION_SOLICITADA" },
      });
    }

    if (data.tipoOrigen === "COMPRA" && data.compraId) {
      const compra = await prisma.compra.findUnique({
        where: { id: data.compraId },
      });
      if (!compra) return apiBadRequest("Compra no encontrada");
      if (compra.clientaId !== clienta.id) {
        return apiBadRequest("Esa compra no te pertenece");
      }
      if (compra.estatus === "ENTREGADO" || compra.estatus === "CANCELADO") {
        return apiBadRequest("No se puede cancelar esta compra");
      }

      const solicitudExistente = await prisma.solicitudCancelacion.findFirst({
        where: {
          compraId: data.compraId,
          estatus: "PENDIENTE",
        },
      });
      if (solicitudExistente) {
        return apiBadRequest("Ya tienes una solicitud de cancelación pendiente para esta compra");
      }
    }

    const solicitud = await prisma.solicitudCancelacion.create({
      data: {
        tipoOrigen: data.tipoOrigen,
        boletoId: data.boletoId,
        compraId: data.compraId,
        clientaId: clienta.id,
        motivo: data.motivo,
      },
    });

    return apiOk(
      {
        solicitudId: solicitud.id,
        mensaje:
          "Tu solicitud de cancelación fue registrada. Las administradoras la revisarán y te contactarán por WhatsApp.",
      },
      201
    );
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    console.error("[POST /api/solicitudes-cancelacion]", error);
    return apiServerError();
  }
}
