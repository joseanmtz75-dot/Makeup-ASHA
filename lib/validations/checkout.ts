import { z } from "zod";

export const MunicipioEnum = z.enum([
  "TONALA",
  "ZAPOPAN",
  "GUADALAJARA",
  "TLAQUEPAQUE",
]);

export const MetodoPagoEnum = z.enum(["TRANSFERENCIA", "EFECTIVO", "OXXO"]);

const telefonoSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 10, "El teléfono debe tener 10 dígitos");

export const checkoutSchema = z.object({
  // Datos de la clienta
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100).trim(),
  telefono: telefonoSchema,
  direccion: z.string().min(5, "La dirección es muy corta").max(300).trim(),
  municipio: MunicipioEnum,
  referenciaDir: z.string().max(300).trim().optional().nullable(),

  // Carrito (1 producto por ahora — se puede extender)
  productoId: z.string().min(1, "Producto requerido"),
  cantidad: z
    .number()
    .int("Cantidad inválida")
    .min(1, "Cantidad mínima 1")
    .max(20, "Cantidad máxima 20"),

  // Pago
  metodoPago: MetodoPagoEnum,
  comprobantePath: z.string().min(1, "Sube un comprobante"),
  referenciaPago: z.string().max(100).trim().optional().nullable(),

  // Notas opcionales
  notasCliente: z.string().max(500).trim().optional().nullable(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
