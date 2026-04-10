import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiOk, apiServerError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/dinamicas
 * Lista pública de dinámicas activas. Sin datos sensibles.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");

    const dinamicas = await prisma.dinamica.findMany({
      where: {
        estatus: { in: ["ACTIVA", "LLENA"] },
        ...(tipo && { tipo: tipo as never }),
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        tipo: true,
        precioBoleto: true,
        totalBoletos: true,
        estatus: true,
        hashSeed: true,
        inicioEn: true,
        cierreEn: true,
        imagenPremioUrl: true,
        premioCustom: true,
        productoPremio: {
          select: {
            id: true,
            nombre: true,
            precio: true,
            imagenes: {
              select: { url: true },
              orderBy: { orden: "asc" as const },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            boletos: { where: { estatus: "CONFIRMADO" } },
          },
        },
      },
      orderBy: { inicioEn: "desc" },
    });

    // Agregar campo calculado de progreso
    const conProgreso = dinamicas.map((d) => ({
      ...d,
      boletosVendidos: d._count.boletos,
      boletosDisponibles: d.totalBoletos - d._count.boletos,
    }));

    return apiOk(conProgreso);
  } catch (error) {
    console.error("[GET /api/dinamicas]", error);
    return apiServerError();
  }
}
