import { Municipio } from "@prisma/client";

export const MUNICIPIOS_LABEL: Record<Municipio, string> = {
  TONALA: "Tonalá",
  ZAPOPAN: "Zapopan",
  GUADALAJARA: "Guadalajara",
  TLAQUEPAQUE: "Tlaquepaque",
  OTRO: "Otro",
};

export const MUNICIPIOS_SOPORTADOS: Municipio[] = [
  "TONALA",
  "ZAPOPAN",
  "GUADALAJARA",
  "TLAQUEPAQUE",
];

export const MUNICIPIOS_OPTIONS = MUNICIPIOS_SOPORTADOS.map((m) => ({
  value: m,
  label: MUNICIPIOS_LABEL[m],
}));
