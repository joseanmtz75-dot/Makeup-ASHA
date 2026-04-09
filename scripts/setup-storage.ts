/**
 * Script para crear los buckets de Supabase Storage requeridos por la app.
 *
 * Uso:
 *   npx tsx scripts/setup-storage.ts
 *
 * Crea:
 *   - productos-publico (público, para fotos del catálogo)
 *   - comprobantes-privado (privado, para comprobantes de pago)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const BUCKETS = [
  {
    name: "productos-publico",
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  {
    name: "comprobantes-privado",
    public: false,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
];

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\n📦 Configurando buckets de Supabase Storage...\n");

  // Listar buckets existentes
  const { data: existentes, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error("❌ Error listando buckets:", listErr.message);
    process.exit(1);
  }

  for (const bucket of BUCKETS) {
    const existe = existentes?.find((b) => b.name === bucket.name);

    if (existe) {
      console.log(`✓ Bucket "${bucket.name}" ya existe — actualizando configuración`);
      const { error } = await supabase.storage.updateBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });
      if (error) {
        console.error(`  ❌ Error actualizando: ${error.message}`);
      } else {
        console.log(`  ✅ Actualizado`);
      }
    } else {
      console.log(`+ Creando bucket "${bucket.name}"...`);
      const { error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });
      if (error) {
        console.error(`  ❌ Error creando: ${error.message}`);
      } else {
        console.log(`  ✅ Creado (${bucket.public ? "público" : "privado"})`);
      }
    }
  }

  console.log("\n✅ Buckets listos\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
