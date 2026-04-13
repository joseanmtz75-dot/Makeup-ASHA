/**
 * Sanitiza texto eliminando todas las etiquetas HTML.
 * Reemplazo server-compatible de isomorphic-dompurify
 * que falla en Vercel serverless por conflicto ESM/CJS.
 *
 * Para los inputs de ASHA (nombres, direcciones, notas)
 * nunca se necesita HTML — se elimina todo.
 */
export function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}
