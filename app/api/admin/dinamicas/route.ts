import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { dinamicaCreateSchema } from "@/lib/validations/dinamica";
import {
  apiOk,
  apiUnauthorized,
  apiZodError,
  apiServerError,
  apiBadRequest,
} from "@/lib/api-response";
import { ZodError } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { generarSeed, hashearSeed } from "@/lib/utils/sortearGanadora";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/dinamicas
 * Lista todas las dinámicas (admin/operadora).
 */
export async function GET(request: NextRequest) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const estatus = searchParams.get("estatus");
    const tipo = searchParams.get("tipo");
    const search = searchParams.get("search");

    const dinamicas = await prisma.dinamica.findMany({
      where: {
        ...(estatus && { estatus: estatus as never }),
        ...(tipo && { tipo: tipo as never }),
        ...(search && {
          nombre: { contains: search, mode: "insensitive" },
        }),
      },
      include: {
        productoPremio: {
          select: { id: true, nombre: true, precio: true },
        },
        clientaGanadora: {
          select: { id: true, nombre: true },
        },
        _count: {
          select: { boletos: { where: { estatus: "CONFIRMADO" } } },
        },
      },
      orderBy: { creadoEn: "desc" },
    });

    return apiOk(dinamicas);
  } catch (error) {
    console.error("[GET /api/admin/dinamicas]", error);
    return apiServerError();
  }
}

/**
 * POST /api/admin/dinamicas
 * Crea una dinámica nueva. Solo admin.
 * Genera seed + hash automáticamente.
 */
export async function POST(request: NextRequest) {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return apiUnauthorized();

  try {
    const body = await request.json();

    if (body.nombre) body.nombre = DOMPurify.sanitize(body.nombre);
    if (body.descripcion)
      body.descripcion = DOMPurify.sanitize(body.descripcion);
    if (body.premioCustom)
      body.premioCustom = DOMPurify.sanitize(body.premioCustom);

    const data = dinamicaCreateSchema.parse(body);

    // Validar que el producto premio existe si se eligió uno
    if (data.productoPremioId) {
      const producto = await prisma.producto.findUnique({
        where: { id: data.productoPremioId },
      });
      if (!producto) return apiBadRequest("Producto premio no encontrado");
    }

    // Generar seed y hash para sorteo verificable
    const seed = generarSeed();
    const hash = hashearSeed(seed);

    const dinamica = await prisma.$transaction(async (tx) => {
      // Crear la dinámica
      const nuevaDinamica = await tx.dinamica.create({
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          tipo: data.tipo,
          precioBoleto: data.precioBoleto,
          totalBoletos: data.totalBoletos,
          productoPremioId: data.productoPremioId,
          premioCustom: data.premioCustom,
          imagenPremioUrl: data.imagenPremioUrl,
          inicioEn: data.inicioEn,
          cierreEn: data.cierreEn,
          seedGanadora: seed,
          hashSeed: hash,
        },
        include: {
          productoPremio: {
            select: { id: true, nombre: true, precio: true },
          },
        },
      });

      // Crear todos los boletos (números del 1 al totalBoletos)
      await tx.boleto.createMany({
        data: Array.from({ length: data.totalBoletos }, (_, i) => ({
          dinamicaId: nuevaDinamica.id,
          numero: i + 1,
        })),
      });

      // Registrar en historial
      await tx.historialDinamica.create({
        data: {
          dinamicaId: nuevaDinamica.id,
          estatusAnterior: "BORRADOR",
          estatusNuevo: "BORRADOR",
          userId: ctx.userId,
          notas: "Dinámica creada",
        },
      });

      return nuevaDinamica;
    });

    return apiOk(dinamica, 201);
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    console.error("[POST /api/admin/dinamicas]", error);
    return apiServerError();
  }
}
