import { z } from "zod";

export const CategoriaProductoEnum = z.enum([
  "LABIALES",
  "BASES",
  "OJOS",
  "RUBORES",
  "BROCHAS",
  "KITS",
  "CUIDADO_PIEL",
  "UNAS",
  "OTROS",
]);

export const productoCreateSchema = z.object({
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
  precio: z
    .number({ message: "Precio inválido" })
    .positive("El precio debe ser mayor a 0")
    .max(999999, "Precio demasiado alto"),
  stock: z
    .number({ message: "Stock inválido" })
    .int("El stock debe ser un número entero")
    .min(0, "El stock no puede ser negativo")
    .default(0),
  categoria: CategoriaProductoEnum,
  sku: z
    .string()
    .max(50, "Máximo 50 caracteres")
    .trim()
    .optional()
    .nullable(),
  activo: z.boolean().default(true),
  destacado: z.boolean().default(false),
  imagenes: z
    .array(z.string().url("URL de imagen inválida"))
    .max(10, "Máximo 10 imágenes por producto")
    .default([]),
});

export const productoUpdateSchema = productoCreateSchema.partial();

export type ProductoCreateInput = z.infer<typeof productoCreateSchema>;
export type ProductoUpdateInput = z.infer<typeof productoUpdateSchema>;
