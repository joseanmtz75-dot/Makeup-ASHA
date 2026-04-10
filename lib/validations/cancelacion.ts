import { z } from "zod";

export const TipoOrigenEnum = z.enum(["BOLETO", "COMPRA"]);
export const MetodoDevolucionEnum = z.enum([
  "TRANSFERENCIA",
  "EFECTIVO",
  "SALDO_PUNTOS",
]);

export const solicitudCancelacionSchema = z
  .object({
    tipoOrigen: TipoOrigenEnum,
    boletoId: z.string().optional().nullable(),
    compraId: z.string().optional().nullable(),
    motivo: z
      .string()
      .min(5, "Explica brevemente el motivo (mínimo 5 caracteres)")
      .max(500, "Máximo 500 caracteres")
      .trim(),
    // Para identificar a la clienta sin auth
    telefono: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length === 10, "El teléfono debe tener 10 dígitos"),
  })
  .refine(
    (d) =>
      (d.tipoOrigen === "BOLETO" && d.boletoId) ||
      (d.tipoOrigen === "COMPRA" && d.compraId),
    "Debes indicar el boleto o la compra a cancelar"
  );

export const revisarCancelacionSchema = z.object({
  estatus: z.enum(["APROBADA", "RECHAZADA"]),
  notasAdmin: z.string().max(500).trim().optional().nullable(),
  montoDevolucion: z
    .number()
    .min(0, "Monto inválido")
    .max(999999)
    .optional()
    .nullable(),
  metodoDevolucion: MetodoDevolucionEnum.optional().nullable(),
});

export type SolicitudCancelacionInput = z.infer<
  typeof solicitudCancelacionSchema
>;
export type RevisarCancelacionInput = z.infer<typeof revisarCancelacionSchema>;
