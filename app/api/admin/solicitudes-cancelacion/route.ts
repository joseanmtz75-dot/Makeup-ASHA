import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { apiOk, apiUnauthorized, apiServerError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/solicitudes-cancelacion
 * Cola de solicitudes de cancelación (admin/operadora).
 */
export async function GET(request: NextRequest) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const estatus = searchParams.get("estatus");

    const solicitudes = await prisma.solicitudCancelacion.findMany({
      where: {
        ...(estatus && { estatus: estatus as never }),
      },
      include: {
        clienta: {
          select: { id: true, nombre: true, telefono: true },
        },
        boleto: {
          select: {
            id: true,
            numero: true,
            dinamica: {
              select: { id: true, nombre: true, precioBoleto: true },
            },
          },
        },
        compra: {
          select: {
            id: true,
            total: true,
            producto: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: { creadoEn: "asc" },
    });

    return apiOk(solicitudes);
  } catch (error) {
    console.error("[GET /api/admin/solicitudes-cancelacion]", error);
    return apiServerError();
  }
}
