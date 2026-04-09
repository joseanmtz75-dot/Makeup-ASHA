/**
 * Genera un link wa.me para abrir WhatsApp con un mensaje predefinido.
 * Asume números mexicanos (código país +52).
 */

const CODIGO_PAIS = "52";

/**
 * Limpia un teléfono dejando solo dígitos y prefija el código de país si falta.
 */
export function normalizarTelefonoMx(telefono: string): string {
  const soloDigitos = telefono.replace(/\D/g, "");
  if (soloDigitos.startsWith(CODIGO_PAIS)) return soloDigitos;
  return CODIGO_PAIS + soloDigitos;
}

/**
 * Genera un link wa.me con mensaje opcional.
 */
export function generarLinkWhatsApp(
  telefono: string,
  mensaje?: string
): string {
  const numero = normalizarTelefonoMx(telefono);
  const url = new URL(`https://wa.me/${numero}`);
  if (mensaje) {
    url.searchParams.set("text", mensaje);
  }
  return url.toString();
}

/**
 * Censura un teléfono mostrando solo los últimos 2 dígitos.
 * Ejemplo: "3312345678" → "33 ** ** 78"
 */
export function censurarTelefono(telefono: string): string {
  const limpio = telefono.replace(/\D/g, "").slice(-10);
  if (limpio.length !== 10) return "** ** ** **";
  return `${limpio.slice(0, 2)} ** ** ${limpio.slice(-2)}`;
}
