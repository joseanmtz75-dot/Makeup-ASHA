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

/** Verifica que los primeros bytes del archivo correspondan a una imagen real */
function validarMagicBytes(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer).slice(0, 12);
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  // WebP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
  return false;
}

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

    // Validar contenido real del archivo (no solo el MIME type del cliente)
    const fileBuffer = await file.arrayBuffer();
    if (!validarMagicBytes(fileBuffer)) {
      return apiBadRequest("El archivo no es una imagen válida");
    }

    const supabase = createAdminClient();

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}.${ext}`;
    const filePath = fileName;

    const { error } = await supabase.storage
      .from("comprobantes-privado")
      .upload(filePath, fileBuffer, {
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
