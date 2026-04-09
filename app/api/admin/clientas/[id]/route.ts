import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { clientaUpdateSchema } from "@/lib/validations/clienta";
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  const { id } = await params;

  try {
    const clienta = await prisma.clienta.findUnique({
      where: { id },
      include: {
        compras: {
          include: { producto: true },
          orderBy: { creadaEn: "desc" },
        },
        referidaPor: { select: { id: true, nombre: true, telefono: true } },
        _count: { select: { compras: true, referidas: true } },
      },
    });

    if (!clienta) return apiNotFound("Clienta");
    return apiOk(clienta);
  } catch (error) {
    console.error("[GET /api/admin/clientas/[id]]", error);
    return apiServerError();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  const { id } = await params;

  try {
    const body = await request.json();

    if (body.nombre) body.nombre = DOMPurify.sanitize(body.nombre);
    if (body.direccion) body.direccion = DOMPurify.sanitize(body.direccion);
    if (body.referenciaDir)
      body.referenciaDir = DOMPurify.sanitize(body.referenciaDir);
    if (body.notas) body.notas = DOMPurify.sanitize(body.notas);

    const data = clientaUpdateSchema.parse(body);

    const existe = await prisma.clienta.findUnique({ where: { id } });
    if (!existe) return apiNotFound("Clienta");

    const clienta = await prisma.clienta.update({
      where: { id },
      data: {
        ...(data.telefono !== undefined && { telefono: data.telefono }),
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.direccion !== undefined && { direccion: data.direccion }),
        ...(data.municipio !== undefined && { municipio: data.municipio }),
        ...(data.referenciaDir !== undefined && {
          referenciaDir: data.referenciaDir,
        }),
        ...(data.notas !== undefined && { notas: data.notas }),
      },
    });

    return apiOk(clienta);
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    console.error("[PUT /api/admin/clientas/[id]]", error);
    return apiServerError();
  }
}

/**
 * DELETE /api/admin/clientas/[id]
 * Solo admin puede eliminar. Si tiene compras, no se permite borrar.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return apiUnauthorized();

  const { id } = await params;

  try {
    const clienta = await prisma.clienta.findUnique({
      where: { id },
      include: { _count: { select: { compras: true } } },
    });

    if (!clienta) return apiNotFound("Clienta");

    if (clienta._count.compras > 0) {
      return apiBadRequest(
        "No se puede eliminar una clienta con compras asociadas"
      );
    }

    await prisma.clienta.delete({ where: { id } });
    return apiOk({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/admin/clientas/[id]]", error);
    return apiServerError();
  }
}
