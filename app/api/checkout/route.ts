import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations/checkout";
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
 * POST /api/checkout
 * Crea una compra anónima.
 * Lookup de clienta por teléfono. Si no existe, la crea.
 * El producto debe estar activo y con stock.
 * El comprobante ya debe estar subido vía /api/comprobantes/upload.
 */
export async function POST(request: NextRequest) {
  if (!checkCsrf(request)) return csrfError();

  const ip = getClientIp(request);
  if (!checkRateLimit(`checkout:${ip}`, 10, 60 * 60 * 1000)) {
    return apiRateLimited();
  }

  try {
    const body = await request.json();

    if (body.nombre) body.nombre = DOMPurify.sanitize(body.nombre);
    if (body.direccion) body.direccion = DOMPurify.sanitize(body.direccion);
    if (body.referenciaDir)
      body.referenciaDir = DOMPurify.sanitize(body.referenciaDir);
    if (body.notasCliente)
      body.notasCliente = DOMPurify.sanitize(body.notasCliente);
    if (body.referenciaPago)
      body.referenciaPago = DOMPurify.sanitize(body.referenciaPago);

    const data = checkoutSchema.parse(body);

    // Verificar producto
    const producto = await prisma.producto.findUnique({
      where: { id: data.productoId },
    });

    if (!producto || !producto.activo) {
      return apiBadRequest("Producto no disponible");
    }

    if (producto.stock < data.cantidad) {
      return apiBadRequest(
        `Solo quedan ${producto.stock} disponibles de "${producto.nombre}"`
      );
    }

    // Crear todo en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Lookup o crear clienta
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
            referenciaDir: data.referenciaDir,
          },
        });
      } else {
        // Actualizar la dirección si cambió
        clienta = await tx.clienta.update({
          where: { id: clienta.id },
          data: {
            direccion: data.direccion,
            municipio: data.municipio,
            referenciaDir: data.referenciaDir ?? clienta.referenciaDir,
            ultimaCompraEn: new Date(),
          },
        });
      }

      // 2. Crear comprobante
      const total = producto.precio * data.cantidad;
      const comprobante = await tx.comprobante.create({
        data: {
          imagenUrl: data.comprobantePath,
          monto: total,
          metodoPago: data.metodoPago,
          referenciaPago: data.referenciaPago,
          estatus: "PENDIENTE",
        },
      });

      // 3. Crear compra
      const compra = await tx.compra.create({
        data: {
          clientaId: clienta.id,
          productoId: producto.id,
          cantidad: data.cantidad,
          precioUnitario: producto.precio,
          total,
          estatus: "PENDIENTE",
          comprobanteId: comprobante.id,
          direccionEntrega: data.direccion,
          municipioEntrega: data.municipio,
          notasCliente: data.notasCliente,
        },
      });

      return { compra, clienta };
    });

    return apiOk(
      {
        compraId: resultado.compra.id,
        clientaId: resultado.clienta.id,
        mensaje:
          "Tu pedido se registró. Las administradoras revisarán tu comprobante y te contactarán por WhatsApp.",
      },
      201
    );
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    console.error("[POST /api/checkout]", error);
    return apiServerError();
  }
}
