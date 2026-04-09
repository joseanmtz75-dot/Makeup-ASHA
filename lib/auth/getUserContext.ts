import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "operadora" | "clienta";

export type UserContext = {
  userId: string;
  email: string | null;
  role: UserRole;
};

/**
 * Obtiene el contexto del usuario autenticado desde el server.
 * Lee el rol de user_metadata.role.
 * Devuelve null si no hay sesión válida.
 */
export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const role = (user.user_metadata?.role as UserRole) || "clienta";

  return {
    userId: user.id,
    email: user.email ?? null,
    role,
  };
}

/**
 * Valida que el usuario tenga uno de los roles permitidos.
 * Devuelve el contexto si pasa, null si no.
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<UserContext | null> {
  const ctx = await getUserContext();
  if (!ctx) return null;
  if (!allowedRoles.includes(ctx.role)) return null;
  return ctx;
}
