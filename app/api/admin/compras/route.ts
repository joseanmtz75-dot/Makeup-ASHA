import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { apiOk, apiUnauthorized, apiServerError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/compras
 * Lista compras con filtros opcionales por estatus / municipio.
 */
export async function GET(request: NextRequest) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const estatus = searchParams.get("estatus");
    const municipio = searchParams.get("municipio");

    const compras = await prisma.compra.findMany({
      where: {
        ...(estatus && { estatus: estatus as never }),
        ...(municipio && { municipioEntrega: municipio as never }),
      },
      include: {
        clienta: true,
        producto: { include: { imagenes: { take: 1 } } },
        comprobante: true,
      },
      orderBy: { creadaEn: "desc" },
    });

    return apiOk(compras);
  } catch (error) {
    console.error("[GET /api/admin/compras]", error);
    return apiServerError();
  }
}
