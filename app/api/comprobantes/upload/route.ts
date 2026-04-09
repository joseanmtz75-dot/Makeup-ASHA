import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  apiOk,
  apiBadRequest,
  apiServerError,
  apiRateLimited,
} from "@/lib/api-response";
import { checkCsrf, csrfError } from "@/lib/csrf";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_TAMANO = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/comprobantes/upload
 * Endpoint público para que las clientas suban su comprobante de pago.
 * Sube al bucket privado. Devuelve solo el path, NO una URL pública.
 */
export async function POST(request: NextRequest) {
  if (!checkCsrf(request)) return csrfError();

  const ip = getClientIp(request);
  if (!checkRateLimit(`comprobante-upload:${ip}`, 20, 60 * 60 * 1000)) {
    return apiRateLimited();
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiBadRequest("No se recibió archivo");
    }

    if (file.size > MAX_TAMANO) {
      return apiBadRequest("Imagen muy grande (máx 5MB)");
    }

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return apiBadRequest("Solo se aceptan imágenes JPG, PNG o WebP");
    }

    const supabase = createAdminClient();

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}.${ext}`;
    const filePath = fileName;

    const { error } = await supabase.storage
      .from("comprobantes-privado")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("[comprobantes/upload]", error);
      return apiServerError();
    }

    return apiOk({ path: filePath });
  } catch (error) {
    console.error("[POST /api/comprobantes/upload]", error);
    return apiServerError();
  }
}
