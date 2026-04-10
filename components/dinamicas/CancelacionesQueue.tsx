"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  X,
  Loader2,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import {
  TIPO_ORIGEN_LABEL,
  ESTATUS_SOLICITUD_LABEL,
  METODO_DEVOLUCION_LABEL,
} from "@/lib/constants/dinamicas";
import { generarLinkWhatsApp } from "@/lib/whatsapp";
import type {
  EstatusSolicitudCancelacion,
  TipoOrigenCancelacion,
  MetodoDevolucion,
} from "@prisma/client";

type Solicitud = {
  id: string;
  tipoOrigen: TipoOrigenCancelacion;
  motivo: string;
  estatus: EstatusSolicitudCancelacion;
  montoDevolucion: number | null;
  metodoDevolucion: MetodoDevolucion | null;
  notasAdmin: string | null;
  creadoEn: string;
  clienta: { id: string; nombre: string; telefono: string };
  boleto: {
    id: string;
    numero: number;
    dinamica: { id: string; nombre: string; precioBoleto: number };
  } | null;
  compra: {
    id: string;
    total: number;
    producto: { id: string; nombre: string };
  } | null;
};

type Props = {
  solicitudes: Solicitud[];
};

export function CancelacionesQueue({ solicitudes: inicial }: Props) {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState(inicial);
  const [, startTransition] = useTransition();
  const [revisando, setRevisando] = useState<Solicitud | null>(null);
  const [decision, setDecision] = useState<"APROBADA" | "RECHAZADA">(
    "APROBADA"
  );
  const [notasAdmin, setNotasAdmin] = useState("");
  const [montoDevolucion, setMontoDevolucion] = useState("");
  const [metodoDevolucion, setMetodoDevolucion] = useState<MetodoDevolucion>(
    "TRANSFERENCIA"
  );
  const [enviando, setEnviando] = useState(false);

  function abrirRevision(sol: Solicitud, dec: "APROBADA" | "RECHAZADA") {
    setRevisando(sol);
    setDecision(dec);
    setNotasAdmin("");
    // Precargar monto sugerido
    const monto = sol.boleto
      ? sol.boleto.dinamica.precioBoleto
      : sol.compra
      ? sol.compra.total
      : 0;
    setMontoDevolucion(monto.toString());
    setMetodoDevolucion("TRANSFERENCIA");
  }

  async function handleRevisar() {
    if (!revisando) return;

    if (decision === "APROBADA" && !montoDevolucion) {
      toast.error("Indica el monto de devolución");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(
        `/api/admin/solicitudes-cancelacion/${revisando.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            estatus: decision,
            notasAdmin: notasAdmin || null,
            montoDevolucion:
              decision === "APROBADA" ? parseFloat(montoDevolucion) : null,
            metodoDevolucion:
              decision === "APROBADA" ? metodoDevolucion : null,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("Error", { description: err.error });
        return;
      }

      toast.success(
        decision === "APROBADA"
          ? "Cancelación aprobada"
          : "Cancelación rechazada"
      );

      setSolicitudes((prev) =>
        prev.filter((s) => s.id !== revisando.id)
      );
      setRevisando(null);
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  if (solicitudes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Check className="mx-auto mb-3 h-12 w-12 text-green-500/50" />
        <p className="text-muted-foreground">
          No hay solicitudes de cancelación pendientes
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {solicitudes.map((sol) => (
          <Card key={sol.id}>
            <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {TIPO_ORIGEN_LABEL[sol.tipoOrigen]}
                  </Badge>
                  <span className="font-medium">{sol.clienta.nombre}</span>
                  <span className="text-sm text-muted-foreground">
                    {sol.clienta.telefono}
                  </span>
                </div>

                {sol.boleto && (
                  <p className="text-sm">
                    Boleto <strong>#{sol.boleto.numero}</strong> de{" "}
                    <strong>{sol.boleto.dinamica.nombre}</strong> (
                    {formatearMxn(sol.boleto.dinamica.precioBoleto)})
                  </p>
                )}
                {sol.compra && (
                  <p className="text-sm">
                    Compra de <strong>{sol.compra.producto.nombre}</strong> (
                    {formatearMxn(sol.compra.total)})
                  </p>
                )}

                <div className="flex items-start gap-1 text-sm">
                  <AlertTriangle className="mt-0.5 h-3 w-3 text-amber-500" />
                  <span className="text-muted-foreground">
                    Motivo: {sol.motivo}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  {new Date(sol.creadoEn).toLocaleString("es-MX")}
                </p>
              </div>

              <div className="flex gap-2">
                <a
                  href={generarLinkWhatsApp(
                    sol.clienta.telefono,
                    `Hola ${sol.clienta.nombre}, sobre tu solicitud de cancelación...`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrirRevision(sol, "RECHAZADA")}
                >
                  <X className="mr-1 h-4 w-4" />
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  onClick={() => abrirRevision(sol, "APROBADA")}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Aprobar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de revisión */}
      <Dialog open={!!revisando} onOpenChange={() => setRevisando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "APROBADA"
                ? "Aprobar cancelación"
                : "Rechazar cancelación"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {decision === "APROBADA" && (
              <>
                <div className="space-y-2">
                  <Label>Monto de devolución *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoDevolucion}
                    onChange={(e) => setMontoDevolucion(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Método de devolución *</Label>
                  <Select
                    value={metodoDevolucion}
                    onValueChange={(v) =>
                      v && setMetodoDevolucion(v as MetodoDevolucion)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(METODO_DEVOLUCION_LABEL) as MetodoDevolucion[]
                      ).map((m) => (
                        <SelectItem key={m} value={m}>
                          {METODO_DEVOLUCION_LABEL[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={notasAdmin}
                onChange={(e) => setNotasAdmin(e.target.value)}
                placeholder="Notas internas sobre la decisión..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRevisando(null)}
                disabled={enviando}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRevisar}
                disabled={enviando}
                variant={decision === "APROBADA" ? "default" : "destructive"}
              >
                {enviando && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {decision === "APROBADA" ? "Aprobar" : "Rechazar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
