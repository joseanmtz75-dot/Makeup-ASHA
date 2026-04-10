import {
  TipoDinamica,
  EstatusDinamica,
  EstatusBoleto,
  EstatusSolicitudCancelacion,
  MetodoDevolucion,
  TipoOrigenCancelacion,
} from "@prisma/client";

export const TIPO_DINAMICA_LABEL: Record<TipoDinamica, string> = {
  CLASICA: "Clásica",
  EXPRESS: "Express",
  VIP: "VIP",
  FLASH: "Flash",
  COMBO_SORPRESA: "Combo sorpresa",
  CAJA_SORPRESA: "Caja sorpresa",
  SUBASTA: "Subasta",
};

export const TIPO_DINAMICA_OPTIONS = (
  Object.keys(TIPO_DINAMICA_LABEL) as TipoDinamica[]
).map((t) => ({
  value: t,
  label: TIPO_DINAMICA_LABEL[t],
}));

export const ESTATUS_DINAMICA_LABEL: Record<EstatusDinamica, string> = {
  BORRADOR: "Borrador",
  ACTIVA: "Activa",
  LLENA: "Llena",
  GANADORA_SELECCIONADA: "Ganadora seleccionada",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada",
};

export const ESTATUS_BOLETO_LABEL: Record<EstatusBoleto, string> = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  PENDIENTE_VALIDACION: "Pendiente validación",
  CONFIRMADO: "Confirmado",
  CANCELACION_SOLICITADA: "Cancelación solicitada",
  CANCELADO: "Cancelado",
};

export const ESTATUS_SOLICITUD_LABEL: Record<
  EstatusSolicitudCancelacion,
  string
> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

export const METODO_DEVOLUCION_LABEL: Record<MetodoDevolucion, string> = {
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
  SALDO_PUNTOS: "Saldo en puntos",
};

export const TIPO_ORIGEN_LABEL: Record<TipoOrigenCancelacion, string> = {
  BOLETO: "Boleto",
  COMPRA: "Compra",
};

// Transiciones válidas de estatus de dinámica
// BORRADOR → ACTIVA → LLENA → GANADORA_SELECCIONADA → ENTREGADA
// CANCELADA puede ocurrir desde cualquier estado anterior a GANADORA_SELECCIONADA
export const TRANSICIONES_DINAMICA: Record<EstatusDinamica, EstatusDinamica[]> =
  {
    BORRADOR: ["ACTIVA", "CANCELADA"],
    ACTIVA: ["LLENA", "CANCELADA"],
    LLENA: ["GANADORA_SELECCIONADA", "CANCELADA"],
    GANADORA_SELECCIONADA: ["ENTREGADA"],
    ENTREGADA: [],
    CANCELADA: [],
  };

// Timeout de reserva de boleto en minutos
export const RESERVA_TIMEOUT_MINUTOS = 30;
