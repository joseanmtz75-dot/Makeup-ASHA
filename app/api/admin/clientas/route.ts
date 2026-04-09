import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { clientaCreateSchema } from "@/lib/validations/clienta";
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
 * GET /api/admin/clientas
 * Lista clientas con filtros opcionales.
 */
export async function GET(request: NextRequest) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const nivel = searchParams.get("nivel");

    const clientas = await prisma.clienta.findMany({
      where: {
        ...(search && {
          OR: [
            { nombre: { contains: search, mode: "insensitive" } },
            { telefono: { contains: search.replace(/\D/g, "") } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(nivel && { nivelActual: nivel as never }),
      },
      include: {
        _count: { select: { compras: true } },
      },
      orderBy: { creadaEn: "desc" },
    });

    return apiOk(clientas);
  } catch (error) {
    console.error("[GET /api/admin/clientas]", error);
    return apiServerError();
  }
}

/**
 * POST /api/admin/clientas
 * Crea una clienta manualmente desde el dashboard.
 * Si el teléfono ya existe, devuelve 409.
 */
export async function POST(request: NextRequest) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  try {
    const body = await request.json();

    if (body.nombre) body.nombre = DOMPurify.sanitize(body.nombre);
    if (body.direccion) body.direccion = DOMPurify.sanitize(body.direccion);
    if (body.referenciaDir)
      body.referenciaDir = DOMPurify.sanitize(body.referenciaDir);
    if (body.notas) body.notas = DOMPurify.sanitize(body.notas);

    const data = clientaCreateSchema.parse(body);

    // Verificar que el teléfono no esté duplicado
    const existe = await prisma.clienta.findUnique({
      where: { telefono: data.telefono },
    });
    if (existe) {
      return apiBadRequest("Ya existe una clienta con ese teléfono");
    }

    const clienta = await prisma.clienta.create({
      data: {
        telefono: data.telefono,
        nombre: data.nombre,
        email: data.email,
        direccion: data.direccion,
        municipio: data.municipio,
        referenciaDir: data.referenciaDir,
        referidaPorId: data.referidaPorId,
        notas: data.notas,
      },
    });

    return apiOk(clienta, 201);
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    console.error("[POST /api/admin/clientas]", error);
    return apiServerError();
  }
}
