import { z } from "zod";

export const MunicipioEnum = z.enum([
  "TONALA",
  "ZAPOPAN",
  "GUADALAJARA",
  "TLAQUEPAQUE",
  "OTRO",
]);

// Telefono mexicano: 10 dígitos (con o sin separadores)
const telefonoSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 10, "El teléfono debe tener 10 dígitos");

export const clientaCreateSchema = z.object({
  telefono: telefonoSchema,
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100).trim(),
  email: z
    .string()
    .email("Email inválido")
    .max(120)
    .trim()
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  direccion: z.string().max(300).trim().optional().nullable(),
  municipio: MunicipioEnum.optional().nullable(),
  referenciaDir: z.string().max(300).trim().optional().nullable(),
  referidaPorId: z.string().optional().nullable(),
  notas: z.string().max(1000).trim().optional().nullable(),
});

export const clientaUpdateSchema = clientaCreateSchema.partial();

export type ClientaCreateInput = z.infer<typeof clientaCreateSchema>;
export type ClientaUpdateInput = z.infer<typeof clientaUpdateSchema>;
