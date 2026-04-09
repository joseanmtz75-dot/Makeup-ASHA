import { CategoriaProducto } from "@prisma/client";

export const CATEGORIAS_LABEL: Record<CategoriaProducto, string> = {
  LABIALES: "Labiales",
  BASES: "Bases y correctores",
  OJOS: "Ojos",
  RUBORES: "Rubores",
  BROCHAS: "Brochas",
  KITS: "Kits y sets",
  CUIDADO_PIEL: "Cuidado de piel",
  UNAS: "Uñas",
  OTROS: "Otros",
};

export const CATEGORIAS_OPTIONS = (
  Object.keys(CATEGORIAS_LABEL) as CategoriaProducto[]
).map((c) => ({
  value: c,
  label: CATEGORIAS_LABEL[c],
}));
