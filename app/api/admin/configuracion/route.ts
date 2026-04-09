import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { configuracionSchema } from "@/lib/validations/configuracion";
import { getConfiguracion } from "@/lib/config";
import {
  apiOk,
  apiUnauthorized,
  apiZodError,
  apiBadRequest,
  apiServerError,
} from "@/lib/api-response";
import { ZodError } from "zod";
import DOMPurify from "isomorphic-dompurify";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  try {
    const config = await getConfiguracion();
    return apiOk(config);
  } catch (error) {
    console.error("[GET /api/admin/configuracion]", error);
    return apiServerError();
  }
}

/**
 * PUT /api/admin/configuracion
 * SOLO admin (no operadora) puede modificar la configuración del sitio.
 */
export async function PUT(request: NextRequest) {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return apiUnauthorized();

  try {
    const body = await request.json();

    // Sanitizar campos de texto libre
    const camposTexto = [
      "nombreNegocio",
      "slogan",
      "heroTitulo",
      "heroSubtitulo",
      "textoLegal",
    ];
    for (const campo of camposTexto) {
      if (body[campo]) body[campo] = DOMPurify.sanitize(body[campo]);
    }

    const data = configuracionSchema.parse(body);

    // Asegurarse que el registro existe
    await getConfiguracion();

    const actualizada = await prisma.configuracionSitio.update({
      where: { id: "default" },
      data,
    });

    return apiOk(actualizada);
  } catch (error) {
    if (error instanceof ZodError) return apiZodError(error);
    if (error instanceof SyntaxError) return apiBadRequest("JSON inválido");
    console.error("[PUT /api/admin/configuracion]", error);
    return apiServerError();
  }
}
