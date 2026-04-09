import { NextRequest } from "next/server";

/**
 * Verificación CSRF básica via header X-Requested-With.
 * Los browsers no permiten setear este header en requests cross-origin sin CORS,
 * lo que sirve como protección contra CSRF en mutaciones.
 *
 * Patrón heredado del proyecto Cuanty — simple pero efectivo para nuestro nivel.
 * En el futuro se puede actualizar a tokens criptográficos.
 */
export function checkCsrf(request: NextRequest | Request): boolean {
  const header = request.headers.get("x-requested-with");
  return header === "XMLHttpRequest";
}

/**
 * Helper para usar en endpoints API. Devuelve Response 403 si no pasa.
 */
export function csrfError() {
  return new Response(JSON.stringify({ error: "CSRF check failed" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
