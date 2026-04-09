import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { productoCreateSchema } from "@/lib/validations/producto";
import {
  apiOk,
  apiUnauthorized,
  apiZodError,
  apiServerError,
  apiBadRequest,
} from "@/lib/api-response";
import { ZodError } from "zod";
import DOMPurify from "isomorphic-dompurify";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/productos
 * Lista todos los productos (admin/operadora).
 */
export async function GET(request: NextRequest) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria");
    const activo = searchParams.get("activo");
    const search = searchParams.get("search");

    const productos = await prisma.producto.findMany({
      where: {
        ...(categoria && { categoria: categoria as never }),
        ...(activo !== null && { activo: activo === "true" }),
        ...(search && {
          OR: [
            { nombre: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        imagenes: { orderBy: { orden: "asc" } },
      },
      orderBy: { creadoEn: "desc" },
    });

    return apiOk(productos);
  } catch (error) {
    console.error("[GET /api/admin/productos]", error);
    return apiServerError();
  }
}

/**
 * POST /api/admin/productos
 * Crea un producto nuevo. Solo admin (operadora no puede crear).
 */
export async function POST(request: NextRequest) {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return apiUnauthorized();

  try {
    const body = await request.json();

    // Sanitización de campos de texto
    if (body.nombre) body.nombre = DOMPurify.sanitize(body.nombre);
    if (body.descripcion) body.descripcion = DOMPurify.sanitize(body.descripcion);
    if (body.sku) body.sku = DOMPurify.sanitize(body.sku);

    const data = productoCreateSchema.parse(body);

    const producto = await prisma.producto.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        stock: data.stock,
        categoria: data.categoria,
        sku: data.sku,
        activo: data.activo,
        destacado: data.destacado,
        imagenes: {
          create: data.imagenes.map((url, orden) => ({ url, orden })),
        },
      },
      include: { imagenes: true },
    });

    return apiOk(producto, 201);
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    console.error("[POST /api/admin/productos]", error);
    return apiServerError();
  }
}
