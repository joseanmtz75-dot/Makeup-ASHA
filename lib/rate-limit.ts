/**
 * Rate limiting en memoria por key (IP, user, etc.).
 * Para serverless single-instance funciona bien.
 * Cuando Vercel escale a múltiples instancias, migrar a Redis o Upstash.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Verifica si una key ha excedido el rate limit.
 * @param key - identificador único (IP, userId, etc.)
 * @param max - número máximo de requests en la ventana
 * @param windowMs - tamaño de la ventana en milisegundos
 * @returns true si está dentro del límite, false si lo excedió
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) {
    return false;
  }

  bucket.count++;
  return true;
}

/**
 * Limpia buckets expirados — llamar ocasionalmente para evitar leak de memoria.
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt < now) {
      buckets.delete(key);
    }
  }
}

/**
 * Helper para extraer IP del request.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
