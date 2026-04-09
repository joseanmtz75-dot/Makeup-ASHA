"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Compra, Clienta, Producto, ImagenProducto, Comprobante, EstatusCompra } from "@prisma/client";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { MUNICIPIOS_LABEL } from "@/lib/constants/municipios";
import { generarLinkWhatsApp } from "@/lib/whatsapp";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShoppingCart,
  Phone,
  MessageCircle,
  Loader2,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CompraCompleta = Compra & {
  clienta: Clienta;
  producto: Producto & { imagenes: ImagenProducto[] };
  comprobante: Comprobante | null;
};

const TABS: Array<{ key: string; label: string; estatus?: EstatusCompra }> = [
  { key: "todos", label: "Todos" },
  { key: "PENDIENTE", label: "Pendientes", estatus: "PENDIENTE" },
  { key: "PAGADO", label: "Pagados", estatus: "PAGADO" },
  { key: "LISTO_ENTREGA", label: "Listos", estatus: "LISTO_ENTREGA" },
  { key: "ENTREGADO", label: "Entregados", estatus: "ENTREGADO" },
  { key: "CANCELADO", label: "Cancelados", estatus: "CANCELADO" },
];

const ESTATUS_BADGE: Record<EstatusCompra, { label: string; className: string }> = {
  PENDIENTE: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-900 border-amber-200",
  },
  PAGADO: {
    label: "Pagado",
    className: "bg-blue-100 text-blue-900 border-blue-200",
  },
  LISTO_ENTREGA: {
    label: "Listo",
    className: "bg-purple-100 text-purple-900 border-purple-200",
  },
  ENTREGADO: {
    label: "Entregado",
    className: "bg-green-100 text-green-900 border-green-200",
  },
  CANCELADO: {
    label: "Cancelado",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const SIGUIENTE: Partial<
  Record<EstatusCompra, { siguiente: EstatusCompra; label: string; icon: typeof CheckCircle2 }>
> = {
  PAGADO: { siguiente: "LISTO_ENTREGA", label: "Marcar listo", icon: PackageCheck },
  LISTO_ENTREGA: {
    siguiente: "ENTREGADO",
    label: "Marcar entregado",
    icon: Truck,
  },
};

export function PedidosLista({
  compras: comprasIniciales,
  conteos,
  estatusActivo,
}: {
  compras: CompraCompleta[];
  conteos: Record<string, number>;
  estatusActivo?: string;
}) {
  const router = useRouter();
  const [compras, setCompras] = useState(comprasIniciales);
  const [, startTransition] = useTransition();

  function actualizarEstatus(id: string, nuevo: EstatusCompra) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/compras/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ estatus: nuevo }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("No se pudo actualizar", { description: err.error });
        return;
      }
      toast.success(`Pedido marcado como ${nuevo}`);
      setCompras((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                estatus: nuevo,
                ...(nuevo === "ENTREGADO" && { entregadaEn: new Date() }),
              }
            : c
        )
      );
      router.refresh();
    });
  }

  function cancelar(id: string) {
    if (
      !confirm(
        "¿Cancelar este pedido? Si ya estaba pagado, el stock volverá al inventario."
      )
    )
      return;
    actualizarEstatus(id, "CANCELADO");
  }

  return (
    <div className="space-y-4">
      {/* Tabs de filtros */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const activo = estatusActivo
            ? estatusActivo === tab.estatus
            : tab.key === "todos";
          const count = tab.estatus
            ? conteos[tab.estatus] || 0
            : Object.values(conteos).reduce((a, b) => a + b, 0);

          return (
            <Link
              key={tab.key}
              href={
                tab.key === "todos"
                  ? "/dashboard/pedidos"
                  : `/dashboard/pedidos?estatus=${tab.estatus}`
              }
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                activo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </Link>
          );
        })}
      </div>

      {compras.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <ShoppingCart className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            No hay pedidos en este estatus
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {compras.map((compra) => {
            const accion = SIGUIENTE[compra.estatus];
            const badge = ESTATUS_BADGE[compra.estatus];

            return (
              <Card key={compra.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    {/* Producto */}
                    <div className="flex flex-1 items-center gap-3">
                      {compra.producto.imagenes[0] ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={compra.producto.imagenes[0].url}
                            alt={compra.producto.nombre}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Package className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold">
                              {compra.producto.nombre}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {compra.cantidad} ×{" "}
                              {formatearMxn(compra.precioUnitario)} ={" "}
                              <strong className="text-primary">
                                {formatearMxn(compra.total)}
                              </strong>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
                              badge.className
                            )}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <Link
                            href={`/dashboard/clientas/${compra.clientaId}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {compra.clienta.nombre}
                          </Link>
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {compra.clienta.telefono}
                          </span>
                          {compra.municipioEntrega && (
                            <span>
                              {MUNICIPIOS_LABEL[compra.municipioEntrega]}
                            </span>
                          )}
                          <span>
                            {new Date(compra.creadaEn).toLocaleDateString(
                              "es-MX"
                            )}
                          </span>
                        </div>

                        {compra.direccionEntrega && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            📍 {compra.direccionEntrega}
                          </div>
                        )}

                        {compra.notasCliente && (
                          <div className="mt-1 text-xs italic text-muted-foreground">
                            "{compra.notasCliente}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={generarLinkWhatsApp(
                          compra.clienta.telefono,
                          `Hola ${compra.clienta.nombre.split(" ")[0]}, te escribo de ASHA sobre tu pedido de "${compra.producto.nombre}".`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-green-200 bg-green-50 px-3 text-sm text-green-700 transition hover:bg-green-100"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </a>

                      {accion && (
                        <Button
                          size="sm"
                          onClick={() =>
                            actualizarEstatus(compra.id, accion.siguiente)
                          }
                        >
                          <accion.icon className="mr-1 h-4 w-4" />
                          {accion.label}
                        </Button>
                      )}

                      {compra.estatus !== "ENTREGADO" &&
                        compra.estatus !== "CANCELADO" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cancelar(compra.id)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Cancelar
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
