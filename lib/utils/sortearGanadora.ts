import { createHash, randomUUID } from "crypto";

/**
 * Genera una seed aleatoria (UUID) para usar como semilla del sorteo.
 * Se guarda al crear la dinámica y se publica al cerrar.
 */
export function generarSeed(): string {
  return randomUUID();
}

/**
 * Genera el hash SHA-256 de la seed.
 * Este hash se publica desde el día 1 para que sea verificable.
 */
export function hashearSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

/**
 * Calcula el número ganador de forma determinista y verificable.
 *
 * Fórmula:
 *   SHA-256(seed + dinamicaId + timestampSorteo)  →  BigInt  →  mod totalBoletos  +  1
 *
 * Cualquiera puede recalcular el resultado con los datos públicos:
 * - seed (se publica al cerrar)
 * - dinamicaId
 * - timestampSorteo (ISO string)
 * - totalBoletos
 */
export function calcularGanador(
  seed: string,
  dinamicaId: string,
  timestampSorteo: string,
  totalBoletos: number
): number {
  const input = seed + dinamicaId + timestampSorteo;
  const hash = createHash("sha256").update(input).digest("hex");
  // Tomamos los primeros 12 hex chars (48 bits) para obtener un número
  const num = BigInt("0x" + hash.slice(0, 12));
  return Number(num % BigInt(totalBoletos)) + 1;
}

/**
 * Verifica que un hash corresponda a una seed dada.
 */
export function verificarHash(seed: string, hashPublicado: string): boolean {
  return hashearSeed(seed) === hashPublicado;
}
