"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Comprobante, Compra, Clienta, Producto, ImagenProducto } from "@prisma/client";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { MUNICIPIOS_LABEL } from "@/lib/constants/municipios";
import { generarLinkWhatsApp } from "@/lib/whatsapp";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, MessageCircle, Phone, Inbox, Package } from "lucide-react";

type ComprobanteCompleto = Comprobante & {
  imagenUrlFirmada: string;
  compra:
    | (Compra & {
        clienta: Clienta;
        producto: Producto & { imagenes: ImagenProducto[] };
      })
    | null;
};

export function ComprobantesQueue({
  comprobantes: iniciales,
}: {
  comprobantes: ComprobanteCompleto[];
}) {
  const router = useRouter();
  const [comprobantes, setComprobantes] = useState(iniciales);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [notas, setNotas] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDecision(
    id: string,
    decision: "APROBADO" | "RECHAZADO"
  ) {
    if (decision === "RECHAZADO" && !notas.trim()) {
      toast.error("Escribe una nota explicando el rechazo");
      return;
    }

    if (
      decision === "RECHAZADO" &&
      !confirm("¿Rechazar este comprobante? La clienta deberá ser contactada.")
    ) {
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/comprobantes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          decision,
          notasValidacion: notas.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("No se pudo procesar", { description: err.error });
        return;
      }

      toast.success(
        decision === "APROBADO"
          ? "Comprobante aprobado, stock actualizado"
          : "Comprobante rechazado"
      );
      setComprobantes((prev) => prev.filter((c) => c.id !== id));
      setSeleccionado(null);
      setNotas("");
      router.refresh();
    });
  }

  if (comprobantes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Inbox className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          No hay comprobantes pendientes 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comprobantes.map((comp) => {
        const expandido = seleccionado === comp.id;
        const compra = comp.compra;

        return (
          <Card key={comp.id}>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                {/* Preview imagen comprobante */}
                <div>
                  <a
                    href={comp.imagenUrlFirmada}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block aspect-[3/4] overflow-hidden rounded-md border bg-muted"
                  >
                    {comp.imagenUrlFirmada && (
                      <Image
                        src={comp.imagenUrlFirmada}
                        alt="Comprobante"
                        fill
                        sizes="200px"
                        className="object-cover transition hover:scale-105"
                      />
                    )}
                  </a>
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    Click para ver completo
                  </p>
                </div>

                {/* Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {formatearMxn(comp.monto)}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {comp.metodoPago}
                      </Badge>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {new Date(comp.creadoEn).toLocaleString("es-MX")}
                    </div>
                  </div>

                  {compra && (
                    <>
                      <div className="rounded-md border bg-muted/30 p-3">
                        <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                          Producto
                        </div>
                        <div className="flex items-center gap-3">
                          {compra.producto.imagenes[0] ? (
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                              <Image
                                src={compra.producto.imagenes[0].url}
                                alt={compra.producto.nombre}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                              <Package className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">
                              {compra.producto.nombre}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {compra.cantidad} ×{" "}
                              {formatearMxn(compra.precioUnitario)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-md border bg-muted/30 p-3">
                        <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                          Clienta
                        </div>
                        <div className="font-medium">
                          {compra.clienta.nombre}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {compra.clienta.telefono}
                          <a
                            href={generarLinkWhatsApp(
                              compra.clienta.telefono,
                              `Hola ${compra.clienta.nombre.split(" ")[0]}, te escribo de ASHA sobre tu pedido de "${compra.producto.nombre}".`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 inline-flex items-center gap-1 text-green-600 hover:underline"
                          >
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp
                          </a>
                        </div>
                        {compra.direccionEntrega && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {compra.direccionEntrega}
                            {compra.municipioEntrega &&
                              ` · ${MUNICIPIOS_LABEL[compra.municipioEntrega]}`}
                          </div>
                        )}
                        {compra.notasCliente && (
                          <div className="mt-1 text-xs italic text-muted-foreground">
                            "{compra.notasCliente}"
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {comp.referenciaPago && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Ref pago: </span>
                      <span className="font-mono">{comp.referenciaPago}</span>
                    </div>
                  )}

                  {expandido && (
                    <div className="space-y-2 border-t pt-3">
                      <Label htmlFor={`notas-${comp.id}`}>
                        Notas (opcional para aprobar, requerido para rechazar)
                      </Label>
                      <Textarea
                        id={`notas-${comp.id}`}
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Por ejemplo: monto incorrecto, comprobante ilegible..."
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {!expandido ? (
                      <Button
                        variant="outline"
                        onClick={() => setSeleccionado(comp.id)}
                      >
                        Revisar
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleDecision(comp.id, "APROBADO")}
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Aprobar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDecision(comp.id, "RECHAZADO")}
                          disabled={isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Rechazar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSeleccionado(null);
                            setNotas("");
                          }}
                          disabled={isPending}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
