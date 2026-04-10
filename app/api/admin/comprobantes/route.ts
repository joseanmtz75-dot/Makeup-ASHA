import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiOk, apiUnauthorized, apiServerError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/comprobantes
 * Lista comprobantes filtrados por estatus.
 * Devuelve signed URL para cada imagen (válida 10 min).
 */
export async function GET(request: NextRequest) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const estatus = searchParams.get("estatus") || "PENDIENTE";

    const comprobantes = await prisma.comprobante.findMany({
      where: { estatus: estatus as never },
      include: {
        compra: {
          include: {
            clienta: true,
            producto: true,
          },
        },
        boleto: {
          include: {
            clienta: true,
            dinamica: {
              select: { id: true, nombre: true, precioBoleto: true },
            },
          },
        },
      },
      orderBy: { creadoEn: "desc" },
    });

    // Generar signed URLs para cada imagen
    const supabase = createAdminClient();

    const conUrls = await Promise.all(
      comprobantes.map(async (comp) => {
        const { data } = await supabase.storage
          .from("comprobantes-privado")
          .createSignedUrl(comp.imagenUrl, 600); // 10 min

        return {
          ...comp,
          imagenUrlFirmada: data?.signedUrl ?? null,
        };
      })
    );

    return apiOk(conUrls);
  } catch (error) {
    console.error("[GET /api/admin/comprobantes]", error);
    return apiServerError();
  }
}
