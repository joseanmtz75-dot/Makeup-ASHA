import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiOk, apiServerError } from "@/lib/api-response";
import type { CategoriaProducto } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/productos
 * Catálogo público — solo productos activos.
 * NO devuelve datos sensibles.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria");
    const search = searchParams.get("search");
    const destacado = searchParams.get("destacado");

    const productos = await prisma.producto.findMany({
      where: {
        activo: true,
        ...(categoria && { categoria: categoria as CategoriaProducto }),
        ...(destacado === "true" && { destacado: true }),
        ...(search && {
          nombre: { contains: search, mode: "insensitive" },
        }),
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        precio: true,
        stock: true,
        categoria: true,
        destacado: true,
        imagenes: {
          select: { url: true, orden: true },
          orderBy: { orden: "asc" },
        },
      },
      orderBy: [{ destacado: "desc" }, { creadoEn: "desc" }],
    });

    return apiOk(productos);
  } catch (error) {
    console.error("[GET /api/productos]", error);
    return apiServerError();
  }
}
