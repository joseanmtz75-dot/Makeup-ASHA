import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/getUserContext";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  apiOk,
  apiUnauthorized,
  apiBadRequest,
  apiServerError,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_TAMANO = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/admin/upload
 * Sube una imagen al bucket especificado.
 * Body: FormData con `file` y `bucket` (productos-publico | comprobantes-privado).
 */
export async function POST(request: NextRequest) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) return apiUnauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const bucket = (formData.get("bucket") as string) || "productos-publico";

    if (!(file instanceof File)) {
      return apiBadRequest("No se recibió archivo");
    }

    if (file.size > MAX_TAMANO) {
      return apiBadRequest("Imagen muy grande (máx 5MB)");
    }

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return apiBadRequest("Tipo de imagen no permitido");
    }

    if (bucket !== "productos-publico" && bucket !== "comprobantes-privado") {
      return apiBadRequest("Bucket inválido");
    }

    // Solo admin puede subir a productos-publico (operadora puede a comprobantes-privado)
    if (bucket === "productos-publico" && ctx.role !== "admin") {
      return apiUnauthorized();
    }

    const supabase = createAdminClient();

    // Generar nombre único: timestamp + random + extensión
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload] error:", uploadError);
      return apiServerError();
    }

    // Si es público, devolver URL pública
    if (bucket === "productos-publico") {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return apiOk({ path: filePath, url: data.publicUrl, bucket });
    }

    // Privado: solo devolver path, la URL signed se genera al consultar
    return apiOk({ path: filePath, bucket });
  } catch (error) {
    console.error("[POST /api/admin/upload]", error);
    return apiServerError();
  }
}
