/**
 * Script para crear una cuenta de admin u operadora.
 *
 * Uso:
 *   npx tsx scripts/crear-admin.ts <email> <password> <nombre> [rol]
 *
 * Ejemplos:
 *   npx tsx scripts/crear-admin.ts socia1@asha.com pass123 "Socia 1" admin
 *   npx tsx scripts/crear-admin.ts ayudante@asha.com pass123 "Ayudante" operadora
 *
 * El rol se guarda en user_metadata.role (admin u operadora).
 * Si no se especifica, default es admin.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const [email, password, nombre, rol = "admin"] = process.argv.slice(2);

  if (!email || !password || !nombre) {
    console.error(
      "Uso: npx tsx scripts/crear-admin.ts <email> <password> <nombre> [admin|operadora]"
    );
    process.exit(1);
  }

  if (rol !== "admin" && rol !== "operadora") {
    console.error("Rol inválido. Usa 'admin' u 'operadora'.");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`\nCreando cuenta de ${rol}...`);
  console.log(`  Email: ${email}`);
  console.log(`  Nombre: ${nombre}\n`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: rol,
      nombre,
    },
  });

  if (error) {
    console.error("❌ Error creando usuario:", error.message);
    process.exit(1);
  }

  console.log("✅ Usuario creado exitosamente");
  console.log(`   ID: ${data.user.id}`);
  console.log(`   Rol: ${rol}`);
  console.log("\nYa puede iniciar sesión en /login\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
