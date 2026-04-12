import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { reservarBoletosSchema } from "@/lib/validations/boleto";
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
import { RESERVA_TIMEOUT_MINUTOS } from "@/lib/constants/dinamicas";

export const dynamic = "force-dynamic";

/**
 * POST /api/boletos/reservar
 * Reservar uno o varios números en una dinámica.
 * Compra anónima: nombre + teléfono + comprobante. Sin registro obligatorio.
 */
export async function POST(request: NextRequest) {
  if (!checkCsrf(request)) return csrfError();

  const ip = getClientIp(request);
  if (!checkRateLimit(`boletos:${ip}`, 20, 60 * 60 * 1000)) {
    return apiRateLimited();
  }

  try {
    const body = await request.json();

    if (body.nombre) body.nombre = DOMPurify.sanitize(body.nombre);
    if (body.direccion) body.direccion = DOMPurify.sanitize(body.direccion);
    if (body.referenciaPago)
      body.referenciaPago = DOMPurify.sanitize(body.referenciaPago);

    const data = reservarBoletosSchema.parse(body);

    // Verificar dinámica
    const dinamica = await prisma.dinamica.findUnique({
      where: { id: data.dinamicaId },
    });

    if (!dinamica || dinamica.estatus !== "ACTIVA") {
      return apiBadRequest("Esta dinámica no está disponible para participar");
    }

    // Verificar que los números solicitados son válidos
    for (const num of data.numeros) {
      if (num < 1 || num > dinamica.totalBoletos) {
        return apiBadRequest(
          `Número ${num} no es válido. Elige entre 1 y ${dinamica.totalBoletos}`
        );
      }
    }

    const timeoutMs = RESERVA_TIMEOUT_MINUTOS * 60 * 1000;
    const ahora = new Date();

    // Todo en una transacción atómica
    const resultado = await prisma.$transaction(async (tx) => {
      // Verificar disponibilidad de cada boleto
      const boletos = await tx.boleto.findMany({
        where: {
          dinamicaId: data.dinamicaId,
          numero: { in: data.numeros },
        },
      });

      const noDisponibles: number[] = [];
      for (const boleto of boletos) {
        // Un boleto está disponible si:
        // 1. Está en DISPONIBLE
        // 2. Está en RESERVADO pero pasó el timeout
        const disponible =
          boleto.estatus === "DISPONIBLE" ||
          (boleto.estatus === "RESERVADO" &&
            boleto.reservadoEn &&
            ahora.getTime() - new Date(boleto.reservadoEn).getTime() >
              timeoutMs);

        if (!disponible) {
          noDisponibles.push(boleto.numero);
        }
      }

      if (noDisponibles.length > 0) {
        throw new Error(
          `BOLETOS_NO_DISPONIBLES:${noDisponibles.join(",")}`
        );
      }

      // Lookup o crear clienta
      let clienta = await tx.clienta.findUnique({
        where: { telefono: data.telefono },
      });

      if (!clienta) {
        clienta = await tx.clienta.create({
          data: {
            telefono: data.telefono,
            nombre: data.nombre,
            direccion: data.direccion,
            municipio: data.municipio,
          },
        });
      } else {
        clienta = await tx.clienta.update({
          where: { id: clienta.id },
          data: {
            direccion: data.direccion,
            municipio: data.municipio,
            ultimaCompraEn: new Date(),
          },
        });
      }

      // Crear comprobante único para todos los boletos
      const montoTotal = dinamica.precioBoleto * data.numeros.length;
      const comprobante = await tx.comprobante.create({
        data: {
          imagenUrl: data.comprobantePath,
          monto: montoTotal,
          metodoPago: data.metodoPago,
          referenciaPago: data.referenciaPago,
          estatus: "PENDIENTE",
        },
      });

      // Reservar cada boleto — el primero se vincula al comprobante
      const boletosReservados = [];
      for (let i = 0; i < data.numeros.length; i++) {
        const num = data.numeros[i];
        const boleto = await tx.boleto.update({
          where: {
            dinamicaId_numero: {
              dinamicaId: data.dinamicaId,
              numero: num,
            },
          },
          data: {
            clientaId: clienta.id,
            nombreCliente: data.nombre,
            telefonoCliente: data.telefono,
            estatus: "PENDIENTE_VALIDACION",
            reservadoEn: ahora,
            // Solo el primer boleto se vincula al comprobante (relación unique)
            ...(i === 0 && { comprobanteId: comprobante.id }),
          },
        });
        boletosReservados.push(boleto);
      }

      return { boletos: boletosReservados, clienta, comprobante };
    });

    return apiOk(
      {
        boletosReservados: resultado.boletos.map((b) => b.numero),
        clientaId: resultado.clienta.id,
        comprobanteId: resultado.comprobante.id,
        mensaje:
          "Tus números quedaron registrados. Las administradoras revisarán tu comprobante y te confirmarán por WhatsApp.",
      },
      201
    );
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    if (
      error instanceof Error &&
      error.message.startsWith("BOLETOS_NO_DISPONIBLES:")
    ) {
      const nums = error.message.split(":")[1];
      return apiBadRequest(
        `Los números ${nums} ya no están disponibles. Elige otros.`
      );
    }
    console.error("[POST /api/boletos/reservar]", error);
    return apiServerError();
  }
}
