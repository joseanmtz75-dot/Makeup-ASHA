import { z } from "zod";

const telefonoSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 10, "El teléfono debe tener 10 dígitos");

export const MunicipioEnum = z.enum([
  "TONALA",
  "ZAPOPAN",
  "GUADALAJARA",
  "TLAQUEPAQUE",
  "OTRO",
]);

export const MetodoPagoEnum = z.enum(["TRANSFERENCIA", "EFECTIVO", "OXXO"]);

export const reservarBoletosSchema = z.object({
  dinamicaId: z.string().min(1, "Dinámica requerida"),
  numeros: z
    .array(z.number().int().min(1, "Número inválido"))
    .min(1, "Elige al menos un número")
    .max(10, "Máximo 10 números por reserva"),
  // Datos de la clienta
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100).trim(),
  telefono: telefonoSchema,
  direccion: z.string().min(5, "La dirección es muy corta").max(300).trim(),
  municipio: MunicipioEnum,
  // Pago
  metodoPago: MetodoPagoEnum,
  comprobantePath: z.string().min(1, "Sube un comprobante"),
  referenciaPago: z.string().max(100).trim().optional().nullable(),
});

export type ReservarBoletosInput = z.infer<typeof reservarBoletosSchema>;
