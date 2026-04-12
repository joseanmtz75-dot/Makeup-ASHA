import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { dinamicaUpdateSchema } from "@/lib/validations/dinamica";
import {
  apiOk,
  apiUnauthorized,
  apiNotFound,
  apiZodError,
  apiServerError,
  apiBadRequest,
} from "@/lib/api-response";
import { ZodError } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { TRANSICIONES_DINAMICA } from "@/lib/constants/dinamicas";
import type { EstatusDinamica } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/dinamicas/[id]
 * Detalle completo de la dinámica con boletos.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  const { id } = await params;

  try {
    const dinamica = await prisma.dinamica.findUnique({
      where: { id },
      include: {
        productoPremio: {
          select: {
            id: true,
            nombre: true,
            precio: true,
            imagenes: { select: { url: true }, orderBy: { orden: "asc" }, take: 1 },
          },
        },
        clientaGanadora: {
          select: { id: true, nombre: true, telefono: true },
        },
        boletos: {
          include: {
            clienta: { select: { id: true, nombre: true, telefono: true } },
            comprobante: {
              select: { id: true, estatus: true, monto: true, metodoPago: true },
            },
          },
          orderBy: { numero: "asc" },
        },
        historial: {
          orderBy: { creadoEn: "desc" },
        },
        _count: {
          select: {
            boletos: true,
          },
        },
      },
    });

    if (!dinamica) return apiNotFound("Dinámica");
    return apiOk(dinamica);
  } catch (error) {
    console.error("[GET /api/admin/dinamicas/[id]]", error);
    return apiServerError();
  }
}

/**
 * PUT /api/admin/dinamicas/[id]
 * Editar dinámica. Solo admin. Solo si está en BORRADOR.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return apiUnauthorized();

  const { id } = await params;

  try {
    const body = await request.json();

    if (body.nombre) body.nombre = DOMPurify.sanitize(body.nombre);
    if (body.descripcion)
      body.descripcion = DOMPurify.sanitize(body.descripcion);
    if (body.premioCustom)
      body.premioCustom = DOMPurify.sanitize(body.premioCustom);

    // Detectar si es un cambio de estatus
    const nuevoEstatus = body.estatus as EstatusDinamica | undefined;

    // Validar campos editables (sin estatus)
    const { estatus: _estatus, ...editableBody } = body;
    const data = dinamicaUpdateSchema.parse(editableBody);

    const existe = await prisma.dinamica.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            boletos: { where: { estatus: { not: "DISPONIBLE" } } },
          },
        },
      },
    });
    if (!existe) return apiNotFound("Dinámica");

    // Solo se pueden editar campos si está en BORRADOR (excepto históricas, que son editables siempre)
    if (
      Object.keys(data).length > 0 &&
      existe.estatus !== "BORRADOR" &&
      !existe.esHistorico
    ) {
      return apiBadRequest(
        "Solo se puede editar una dinámica en estado Borrador"
      );
    }

    // Los campos de ganadora manual solo se aceptan en dinámicas históricas
    const seteoGanadora =
      data.clientaGanadoraId !== undefined || data.boletoGanador !== undefined;
    if (seteoGanadora && !existe.esHistorico) {
      return apiBadRequest(
        "La ganadora solo puede asignarse manualmente en dinámicas históricas"
      );
    }

    // Validar transición de estatus si se pidió
    if (nuevoEstatus && nuevoEstatus !== existe.estatus) {
      const transicionesValidas = TRANSICIONES_DINAMICA[existe.estatus];
      if (!transicionesValidas.includes(nuevoEstatus)) {
        return apiBadRequest(
          `No se puede pasar de ${existe.estatus} a ${nuevoEstatus}`
        );
      }
    }

    // Validar producto premio si se cambió
    if (data.productoPremioId) {
      const producto = await prisma.producto.findUnique({
        where: { id: data.productoPremioId },
      });
      if (!producto) return apiBadRequest("Producto premio no encontrado");
    }

    const dinamica = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};

      if (data.nombre !== undefined) updateData.nombre = data.nombre;
      if (data.descripcion !== undefined)
        updateData.descripcion = data.descripcion;
      if (data.tipo !== undefined) updateData.tipo = data.tipo;
      if (data.precioBoleto !== undefined)
        updateData.precioBoleto = data.precioBoleto;
      if (data.productoPremioId !== undefined)
        updateData.productoPremioId = data.productoPremioId;
      if (data.premioCustom !== undefined)
        updateData.premioCustom = data.premioCustom;
      if (data.imagenPremioUrl !== undefined)
        updateData.imagenPremioUrl = data.imagenPremioUrl;
      if (data.inicioEn !== undefined) updateData.inicioEn = data.inicioEn;
      if (data.cierreEn !== undefined) updateData.cierreEn = data.cierreEn;

      // Ganadora manual para dinámicas históricas
      if (existe.esHistorico) {
        if (data.clientaGanadoraId !== undefined)
          updateData.clientaGanadoraId = data.clientaGanadoraId;
        if (data.boletoGanador !== undefined)
          updateData.boletoGanador = data.boletoGanador;
      }

      // Si se cambia totalBoletos, solo permitir si no hay boletos vendidos
      if (
        data.totalBoletos !== undefined &&
        data.totalBoletos !== existe.totalBoletos
      ) {
        if (existe._count.boletos > 0) {
          throw new Error("NO_CAMBIAR_BOLETOS");
        }
        updateData.totalBoletos = data.totalBoletos;
        await tx.boleto.deleteMany({ where: { dinamicaId: id } });
        await tx.boleto.createMany({
          data: Array.from({ length: data.totalBoletos }, (_, i) => ({
            dinamicaId: id,
            numero: i + 1,
          })),
        });
      }

      if (nuevoEstatus && nuevoEstatus !== existe.estatus) {
        updateData.estatus = nuevoEstatus;
        if (nuevoEstatus === "ACTIVA" && !existe.inicioEn) {
          updateData.inicioEn = new Date();
        }

        await tx.historialDinamica.create({
          data: {
            dinamicaId: id,
            estatusAnterior: existe.estatus,
            estatusNuevo: nuevoEstatus,
            userId: ctx.userId,
          },
        });
      }

      return tx.dinamica.update({
        where: { id },
        data: updateData,
        include: {
          productoPremio: {
            select: { id: true, nombre: true, precio: true },
          },
        },
      });
    });

    return apiOk(dinamica);
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    if (error instanceof Error && error.message === "NO_CAMBIAR_BOLETOS") {
      return apiBadRequest(
        "No se puede cambiar el total de boletos porque ya hay boletos vendidos"
      );
    }
    console.error("[PUT /api/admin/dinamicas/[id]]", error);
    return apiServerError();
  }
}

/**
 * DELETE /api/admin/dinamicas/[id]
 * Solo admin. Solo si está en BORRADOR (sin boletos vendidos).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return apiUnauthorized();

  const { id } = await params;

  try {
    const existe = await prisma.dinamica.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            boletos: { where: { estatus: { not: "DISPONIBLE" } } },
          },
        },
      },
    });

    if (!existe) return apiNotFound("Dinámica");

    if (existe.estatus !== "BORRADOR") {
      return apiBadRequest(
        "Solo se puede eliminar una dinámica en estado Borrador"
      );
    }

    if (existe._count.boletos > 0) {
      return apiBadRequest(
        "No se puede eliminar, hay boletos con actividad"
      );
    }

    await prisma.$transaction([
      prisma.historialDinamica.deleteMany({ where: { dinamicaId: id } }),
      prisma.boleto.deleteMany({ where: { dinamicaId: id } }),
      prisma.dinamica.delete({ where: { id } }),
    ]);

    return apiOk({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/admin/dinamicas/[id]]", error);
    return apiServerError();
  }
}
