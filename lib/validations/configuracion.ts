import { z } from "zod";

export const configuracionSchema = z.object({
  nombreNegocio: z.string().min(1, "Requerido").max(100).trim(),
  slogan: z.string().max(200).trim().optional().nullable(),
  logoUrl: z
    .string()
    .url("URL inválida")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  colorPrimario: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Debe ser color hex ej #E91E63"),
  colorSecundario: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Debe ser color hex ej #F8BBD0"),
  heroTitulo: z.string().max(120).trim().optional().nullable(),
  heroSubtitulo: z.string().max(300).trim().optional().nullable(),
  heroImagenUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  whatsappPrincipal: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || v.length === 10 || v.length === 12, {
      message: "Debe tener 10 dígitos (sin código país) o 12 (con +52)",
    })
    .optional()
    .nullable(),
  emailContacto: z
    .string()
    .email("Email inválido")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  facebookUrl: z
    .string()
    .url("URL inválida")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  instagramUrl: z
    .string()
    .url("URL inválida")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  tiktokUrl: z
    .string()
    .url("URL inválida")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  textoLegal: z.string().max(2000).trim().optional().nullable(),
});

export type ConfiguracionInput = z.infer<typeof configuracionSchema>;
