"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trophy,
  Gift,
  Loader2,
  Hash,
  ShieldCheck,
  Clock,
  MessageCircle,
} from "lucide-react";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import {
  ESTATUS_DINAMICA_LABEL,
  ESTATUS_BOLETO_LABEL,
  TIPO_DINAMICA_LABEL,
} from "@/lib/constants/dinamicas";
import { generarLinkWhatsApp } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { EstatusDinamica, EstatusBoleto, TipoDinamica } from "@prisma/client";

type BoletoAdmin = {
  id: string;
  numero: number;
  estatus: EstatusBoleto;
  clienta: { id: string; nombre: string; telefono: string } | null;
  comprobante: {
    id: string;
    estatus: string;
    monto: number;
    metodoPago: string;
  } | null;
  nombreCliente: string | null;
  telefonoCliente: string | null;
  reservadoEn: string | null;
  confirmadoEn: string | null;
};

type DinamicaFull = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoDinamica;
  precioBoleto: number;
  totalBoletos: number;
  estatus: EstatusDinamica;
  esHistorico: boolean;
  hashSeed: string | null;
  seedGanadora: string | null;
  boletoGanador: number | null;
  sorteadoEn: string | null;
  premioCustom: string | null;
  imagenPremioUrl: string | null;
  inicioEn: string | null;
  cierreEn: string | null;
  productoPremio: {
    id: string;
    nombre: string;
    precio: number;
    imagenes: { url: string }[];
  } | null;
  clientaGanadora: {
    id: string;
    nombre: string;
    telefono: string;
  } | null;
  boletos: BoletoAdmin[];
  historial: {
    id: string;
    estatusAnterior: EstatusDinamica;
    estatusNuevo: EstatusDinamica;
    notas: string | null;
    creadoEn: string;
  }[];
};

const BOLETO_COLOR: Record<EstatusBoleto, string> = {
  DISPONIBLE: "bg-muted text-muted-foreground border-border",
  RESERVADO: "bg-yellow-100 text-yellow-800 border-yellow-300",
  PENDIENTE_VALIDACION: "bg-orange-100 text-orange-800 border-orange-300",
  CONFIRMADO: "bg-green-100 text-green-800 border-green-300",
  CANCELACION_SOLICITADA: "bg-red-100 text-red-800 border-red-300",
  CANCELADO: "bg-gray-200 text-gray-500 border-gray-300 line-through",
};

export function DinamicaDetalle({ dinamica }: { dinamica: DinamicaFull }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [accion, setAccion] = useState<string>("");
  const [ganadoraBoletoId, setGanadoraBoletoId] = useState<string>("");

  const boletosConfirmados = dinamica.boletos.filter(
    (b) => b.estatus === "CONFIRMADO"
  ).length;
  const boletosPendientes = dinamica.boletos.filter(
    (b) => b.estatus === "PENDIENTE_VALIDACION"
  ).length;
  const boletosDisponibles = dinamica.boletos.filter(
    (b) => b.estatus === "DISPONIBLE"
  ).length;
  const premio = dinamica.premioCustom ?? dinamica.productoPremio?.nombre ?? "Sin premio definido";
  const recaudado = boletosConfirmados * dinamica.precioBoleto;
  const recaudadoTotal = dinamica.totalBoletos * dinamica.precioBoleto;

  function handleAccion(tipo: string) {
    setAccion(tipo);

    if (tipo === "sortear") {
      if (
        !confirm(
          "¿Seleccionar ganadora? Esta acción no se puede deshacer. El resultado será público."
        )
      )
        return;
    }

    if (tipo === "entregar") {
      if (!confirm("¿Confirmar que el premio fue entregado?")) return;
    }

    startTransition(async () => {
      let url = "";
      if (tipo === "sortear") {
        url = `/api/admin/dinamicas/${dinamica.id}/sortear`;
      } else if (tipo === "entregar") {
        url = `/api/admin/dinamicas/${dinamica.id}/marcar-entregada`;
      } else if (tipo === "cancelar") {
        url = `/api/admin/dinamicas/${dinamica.id}`;
      }

      const res = await fetch(url, {
        method: tipo === "cancelar" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        ...(tipo === "cancelar" && {
          body: JSON.stringify({ estatus: "CANCELADA" }),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("Error", { description: err.error });
        setAccion("");
        return;
      }

      const labels: Record<string, string> = {
        sortear: "Ganadora seleccionada",
        entregar: "Premio marcado como entregado",
        cancelar: "Dinámica cancelada",
      };
      toast.success(labels[tipo]);
      router.refresh();
      setAccion("");
    });
  }

  function handleAsignarGanadora() {
    const boleto = dinamica.boletos.find((b) => b.id === ganadoraBoletoId);
    if (!boleto) {
      toast.error("Selecciona un boleto");
      return;
    }
    const clienta = boleto.clienta;
    if (!clienta) {
      toast.error(
        "Este boleto no tiene clienta vinculada (nombre libre). Vincúlalo primero desde Clientas."
      );
      return;
    }
    if (
      !confirm(
        `¿Marcar a ${clienta.nombre} (boleto #${boleto.numero}) como ganadora de esta dinámica histórica?`
      )
    )
      return;

    setAccion("asignar-ganadora");
    startTransition(async () => {
      const res = await fetch(`/api/admin/dinamicas/${dinamica.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          boletoGanador: boleto.numero,
          clientaGanadoraId: clienta.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("Error", { description: err.error });
        setAccion("");
        return;
      }
      toast.success("Ganadora asignada");
      router.refresh();
      setAccion("");
    });
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{dinamica.nombre}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{TIPO_DINAMICA_LABEL[dinamica.tipo]}</Badge>
            <Badge
              variant={
                dinamica.estatus === "ACTIVA"
                  ? "default"
                  : dinamica.estatus === "CANCELADA"
                  ? "destructive"
                  : "secondary"
              }
            >
              {ESTATUS_DINAMICA_LABEL[dinamica.estatus]}
            </Badge>
            {dinamica.esHistorico && (
              <Badge variant="outline" className="border-amber-500 text-amber-700">
                Histórica
              </Badge>
            )}
          </div>
          {dinamica.descripcion && (
            <p className="mt-2 text-muted-foreground">{dinamica.descripcion}</p>
          )}
        </div>

        <div className="flex gap-2">
          {dinamica.estatus === "LLENA" && (
            <Button
              onClick={() => handleAccion("sortear")}
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isPending && accion === "sortear" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Trophy className="mr-2 h-4 w-4" />
              Seleccionar ganadora
            </Button>
          )}
          {dinamica.estatus === "GANADORA_SELECCIONADA" && (
            <Button
              onClick={() => handleAccion("entregar")}
              disabled={isPending}
            >
              {isPending && accion === "entregar" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Gift className="mr-2 h-4 w-4" />
              Marcar como entregada
            </Button>
          )}
          {["BORRADOR", "ACTIVA", "LLENA"].includes(dinamica.estatus) && (
            <Button
              variant="destructive"
              onClick={() => handleAccion("cancelar")}
              disabled={isPending}
            >
              Cancelar dinámica
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {boletosConfirmados}/{dinamica.totalBoletos}
            </div>
            <p className="text-sm text-muted-foreground">Confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{boletosPendientes}</div>
            <p className="text-sm text-muted-foreground">
              Pendientes de validación
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{boletosDisponibles}</div>
            <p className="text-sm text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatearMxn(recaudado)}
            </div>
            <p className="text-sm text-muted-foreground">
              Recaudado de {formatearMxn(recaudadoTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Asignar ganadora manualmente (solo históricas sin ganadora) */}
      {dinamica.esHistorico && !dinamica.clientaGanadora && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Trophy className="h-5 w-5" />
              Asignar ganadora manualmente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-amber-900">
              Esta es una dinámica histórica (previa al sistema verificable).
              Selecciona el número del boleto ganador — la clienta se asigna
              automáticamente.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={ganadoraBoletoId}
                onChange={(e) => setGanadoraBoletoId(e.target.value)}
                className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— Elige un boleto —</option>
                {dinamica.boletos
                  .filter(
                    (b) => b.estatus === "CONFIRMADO" && (b.clienta || b.nombreCliente)
                  )
                  .map((b) => {
                    const nombre = b.clienta?.nombre ?? b.nombreCliente ?? "";
                    const sinClienta = !b.clienta;
                    return (
                      <option key={b.id} value={b.id} disabled={sinClienta}>
                        #{b.numero} — {nombre}
                        {sinClienta ? " (sin clienta vinculada)" : ""}
                      </option>
                    );
                  })}
              </select>
              <Button
                onClick={handleAsignarGanadora}
                disabled={isPending || !ganadoraBoletoId}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isPending && accion === "asignar-ganadora" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Asignar ganadora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado del sorteo */}
      {dinamica.boletoGanador && dinamica.clientaGanadora && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Trophy className="h-5 w-5" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-amber-900">
            <p>
              <strong>Número ganador:</strong> #{dinamica.boletoGanador}
            </p>
            <p>
              <strong>Ganadora:</strong> {dinamica.clientaGanadora.nombre}
            </p>
            <p>
              <strong>Premio:</strong> {premio}
            </p>
            {dinamica.clientaGanadora.telefono && (
              <a
                href={generarLinkWhatsApp(
                  dinamica.clientaGanadora.telefono,
                  `Hola ${dinamica.clientaGanadora.nombre}, ganaste la dinámica "${dinamica.nombre}". ¡Felicidades! 🎉`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" />
                Contactar por WhatsApp
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verificación */}
      {dinamica.hashSeed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4" />
              Verificación criptográfica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs font-mono">
            <p>
              <span className="text-muted-foreground">Hash público: </span>
              {dinamica.hashSeed}
            </p>
            {dinamica.seedGanadora &&
              (dinamica.estatus === "GANADORA_SELECCIONADA" ||
                dinamica.estatus === "ENTREGADA") && (
                <>
                  <p>
                    <span className="text-muted-foreground">Seed: </span>
                    {dinamica.seedGanadora}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Timestamp: </span>
                    {dinamica.sorteadoEn}
                  </p>
                </>
              )}
          </CardContent>
        </Card>
      )}

      {/* Grid de boletos */}
      <Card>
        <CardHeader>
          <CardTitle>Boletos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
            {dinamica.boletos.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "group relative flex aspect-square cursor-default flex-col items-center justify-center rounded-lg border text-sm font-bold transition-colors",
                  BOLETO_COLOR[b.estatus],
                  b.numero === dinamica.boletoGanador &&
                    "ring-2 ring-amber-500 ring-offset-2"
                )}
                title={`#${b.numero} — ${ESTATUS_BOLETO_LABEL[b.estatus]}${
                  b.clienta
                    ? ` — ${b.clienta.nombre}`
                    : b.nombreCliente
                    ? ` — ${b.nombreCliente}`
                    : ""
                }`}
              >
                {b.numero}
                {b.numero === dinamica.boletoGanador && (
                  <Trophy className="absolute -right-1 -top-1 h-3 w-3 text-amber-500" />
                )}
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {(
              [
                "DISPONIBLE",
                "RESERVADO",
                "PENDIENTE_VALIDACION",
                "CONFIRMADO",
                "CANCELACION_SOLICITADA",
                "CANCELADO",
              ] as EstatusBoleto[]
            ).map((est) => (
              <div key={est} className="flex items-center gap-1">
                <div
                  className={cn(
                    "h-3 w-3 rounded border",
                    BOLETO_COLOR[est]
                  )}
                />
                <span>{ESTATUS_BOLETO_LABEL[est]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de participantes */}
      {dinamica.boletos.some(
        (b) => b.estatus !== "DISPONIBLE" && b.estatus !== "CANCELADO"
      ) && (
        <Card>
          <CardHeader>
            <CardTitle>Participantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="border-b bg-muted/30 text-left text-xs font-medium uppercase">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Clienta</th>
                    <th className="px-3 py-2">Teléfono</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Comprobante</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {dinamica.boletos
                    .filter(
                      (b) =>
                        b.estatus !== "DISPONIBLE" && b.estatus !== "CANCELADO"
                    )
                    .map((b) => {
                      const nombre =
                        b.clienta?.nombre ?? b.nombreCliente ?? "—";
                      const telefono =
                        b.clienta?.telefono ?? b.telefonoCliente ?? "";
                      return (
                        <tr key={b.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-bold">{b.numero}</td>
                          <td className="px-3 py-2">{nombre}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {telefono}
                          </td>
                          <td className="px-3 py-2">
                            <Badge
                              variant={
                                b.estatus === "CONFIRMADO"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {ESTATUS_BOLETO_LABEL[b.estatus]}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {b.comprobante
                              ? b.comprobante.estatus
                              : "—"}
                          </td>
                          <td className="px-3 py-2">
                            {telefono && (
                              <a
                                href={generarLinkWhatsApp(telefono)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4 text-green-600" />
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial */}
      {dinamica.historial.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Historial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dinamica.historial.map((h) => (
                <div
                  key={h.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <span className="font-medium">
                      {ESTATUS_DINAMICA_LABEL[h.estatusAnterior]} →{" "}
                      {ESTATUS_DINAMICA_LABEL[h.estatusNuevo]}
                    </span>
                    {h.notas && (
                      <span className="ml-2 text-muted-foreground">
                        — {h.notas}
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(h.creadoEn).toLocaleString("es-MX")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
