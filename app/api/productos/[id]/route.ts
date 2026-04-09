import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiOk, apiNotFound, apiServerError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/productos/[id]
 * Detalle público de un producto. Solo si está activo.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const producto = await prisma.producto.findFirst({
      where: { id, activo: true },
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
    });

    if (!producto) return apiNotFound("Producto");
    return apiOk(producto);
  } catch (error) {
    console.error("[GET /api/productos/[id]]", error);
    return apiServerError();
  }
}
