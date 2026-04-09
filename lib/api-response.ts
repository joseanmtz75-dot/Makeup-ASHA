import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Helpers para respuestas API consistentes.
 * NUNCA exponer error.message ni stack traces al cliente.
 */

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { error: message, ...(code ? { code } : {}) },
    { status }
  );
}

export function apiUnauthorized() {
  return apiError("No autorizado", 401, "UNAUTHORIZED");
}

export function apiForbidden() {
  return apiError("No tienes permiso para hacer esto", 403, "FORBIDDEN");
}

export function apiNotFound(recurso = "Recurso") {
  return apiError(`${recurso} no encontrado`, 404, "NOT_FOUND");
}

export function apiBadRequest(message = "Datos inválidos") {
  return apiError(message, 400, "BAD_REQUEST");
}

export function apiServerError() {
  return apiError("Error interno del servidor", 500, "SERVER_ERROR");
}

export function apiRateLimited() {
  return apiError("Demasiadas peticiones, intenta más tarde", 429, "RATE_LIMITED");
}

/**
 * Maneja errores de Zod devolviendo el primer error en formato amigable.
 */
export function apiZodError(error: ZodError) {
  const first = error.issues[0];
  const path = first.path.length > 0 ? first.path.join(".") + ": " : "";
  return apiBadRequest(`${path}${first.message}`);
}
