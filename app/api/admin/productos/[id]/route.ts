import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { productoUpdateSchema } from "@/lib/validations/producto";
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

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/productos/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  const { id } = await params;

  try {
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: { imagenes: { orderBy: { orden: "asc" } } },
    });

    if (!producto) return apiNotFound("Producto");
    return apiOk(producto);
  } catch (error) {
    console.error("[GET /api/admin/productos/[id]]", error);
    return apiServerError();
  }
}

/**
 * PUT /api/admin/productos/[id]
 * Solo admin puede editar.
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
    if (body.descripcion) body.descripcion = DOMPurify.sanitize(body.descripcion);
    if (body.sku) body.sku = DOMPurify.sanitize(body.sku);

    const data = productoUpdateSchema.parse(body);

    const existe = await prisma.producto.findUnique({ where: { id } });
    if (!existe) return apiNotFound("Producto");

    // Si se enviaron imágenes, reemplazar las existentes
    const updateData: Record<string, unknown> = {
      ...(data.nombre !== undefined && { nombre: data.nombre }),
      ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
      ...(data.precio !== undefined && { precio: data.precio }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.categoria !== undefined && { categoria: data.categoria }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.activo !== undefined && { activo: data.activo }),
      ...(data.destacado !== undefined && { destacado: data.destacado }),
    };

    if (data.imagenes !== undefined) {
      // Eliminar imágenes anteriores y crear nuevas en una transacción
      await prisma.$transaction([
        prisma.imagenProducto.deleteMany({ where: { productoId: id } }),
        prisma.producto.update({
          where: { id },
          data: {
            ...updateData,
            imagenes: {
              create: data.imagenes.map((url, orden) => ({ url, orden })),
            },
          },
        }),
      ]);
    } else {
      await prisma.producto.update({ where: { id }, data: updateData });
    }

    const producto = await prisma.producto.findUnique({
      where: { id },
      include: { imagenes: { orderBy: { orden: "asc" } } },
    });

    return apiOk(producto);
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    console.error("[PUT /api/admin/productos/[id]]", error);
    return apiServerError();
  }
}

/**
 * DELETE /api/admin/productos/[id]
 * Solo admin puede eliminar.
 * Soft delete: marca como activo: false en lugar de borrar (para preservar historial de compras).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return apiUnauthorized();

  const { id } = await params;

  try {
    const existe = await prisma.producto.findUnique({
      where: { id },
      include: { _count: { select: { compras: true } } },
    });

    if (!existe) return apiNotFound("Producto");

    // Si tiene compras asociadas, soft delete (desactivar)
    if (existe._count.compras > 0) {
      await prisma.producto.update({
        where: { id },
        data: { activo: false },
      });
      return apiOk({ deleted: false, deactivated: true });
    }

    // Sin compras asociadas: hard delete
    await prisma.producto.delete({ where: { id } });
    return apiOk({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/admin/productos/[id]]", error);
    return apiServerError();
  }
}
