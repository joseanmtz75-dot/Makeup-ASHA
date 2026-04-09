/**
 * Formatea un número como moneda mexicana.
 * Ejemplo: 1234.5 → "$1,234.50"
 */
export function formatearMxn(monto: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(monto);
}

/**
 * Formatea un número como moneda mexicana sin decimales.
 * Ejemplo: 1234 → "$1,234"
 */
export function formatearMxnEntero(monto: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto);
}
