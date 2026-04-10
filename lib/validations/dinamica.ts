import { z } from "zod";

export const TipoDinamicaEnum = z.enum([
  "CLASICA",
  "EXPRESS",
  "VIP",
  "FLASH",
  "COMBO_SORPRESA",
  "CAJA_SORPRESA",
  "SUBASTA",
]);

export const EstatusDinamicaEnum = z.enum([
  "BORRADOR",
  "ACTIVA",
  "LLENA",
  "GANADORA_SELECCIONADA",
  "ENTREGADA",
  "CANCELADA",
]);

export const dinamicaCreateSchema = z
  .object({
    nombre: z
      .string()
      .min(2, "Mínimo 2 caracteres")
      .max(120, "Máximo 120 caracteres")
      .trim(),
    descripcion: z
      .string()
      .max(2000, "Máximo 2000 caracteres")
      .trim()
      .optional()
      .nullable(),
    tipo: TipoDinamicaEnum.default("CLASICA"),
    precioBoleto: z
      .number({ message: "Precio inválido" })
      .positive("El precio debe ser mayor a 0")
      .max(99999, "Precio demasiado alto"),
    totalBoletos: z
      .number({ message: "Total inválido" })
      .int("Debe ser número entero")
      .min(2, "Mínimo 2 boletos")
      .max(1000, "Máximo 1000 boletos"),
    productoPremioId: z.string().optional().nullable(),
    premioCustom: z
      .string()
      .max(300, "Máximo 300 caracteres")
      .trim()
      .optional()
      .nullable(),
    imagenPremioUrl: z.string().url("URL inválida").optional().nullable(),
    inicioEn: z.coerce.date().optional().nullable(),
    cierreEn: z.coerce.date().optional().nullable(),
  })
  .refine(
    (d) => d.productoPremioId || d.premioCustom,
    "Debes elegir un producto del catálogo o escribir un premio personalizado"
  );

export const dinamicaUpdateSchema = z.object({
  nombre: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres")
    .trim()
    .optional(),
  descripcion: z
    .string()
    .max(2000, "Máximo 2000 caracteres")
    .trim()
    .optional()
    .nullable(),
  tipo: TipoDinamicaEnum.optional(),
  precioBoleto: z
    .number({ message: "Precio inválido" })
    .positive("El precio debe ser mayor a 0")
    .max(99999, "Precio demasiado alto")
    .optional(),
  totalBoletos: z
    .number({ message: "Total inválido" })
    .int("Debe ser número entero")
    .min(2, "Mínimo 2 boletos")
    .max(1000, "Máximo 1000 boletos")
    .optional(),
  productoPremioId: z.string().optional().nullable(),
  premioCustom: z
    .string()
    .max(300, "Máximo 300 caracteres")
    .trim()
    .optional()
    .nullable(),
  imagenPremioUrl: z.string().url("URL inválida").optional().nullable(),
  inicioEn: z.coerce.date().optional().nullable(),
  cierreEn: z.coerce.date().optional().nullable(),
});

export type DinamicaCreateInput = z.infer<typeof dinamicaCreateSchema>;
export type DinamicaUpdateInput = z.infer<typeof dinamicaUpdateSchema>;
