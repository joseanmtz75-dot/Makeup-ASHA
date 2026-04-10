"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Ticket,
  Pencil,
  Trash2,
  Play,
  Eye,
  Plus,
} from "lucide-react";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import {
  TIPO_DINAMICA_LABEL,
  ESTATUS_DINAMICA_LABEL,
} from "@/lib/constants/dinamicas";
import type { EstatusDinamica, TipoDinamica } from "@prisma/client";
import { cn } from "@/lib/utils";

type DinamicaRow = {
  id: string;
  nombre: string;
  tipo: TipoDinamica;
  estatus: EstatusDinamica;
  precioBoleto: number;
  totalBoletos: number;
  inicioEn: string | null;
  creadoEn: string;
  productoPremio: { id: string; nombre: string; precio: number } | null;
  premioCustom: string | null;
  clientaGanadora: { id: string; nombre: string } | null;
  _count: { boletos: number };
};

const ESTATUS_VARIANT: Record<EstatusDinamica, "default" | "secondary" | "destructive" | "outline"> = {
  BORRADOR: "secondary",
  ACTIVA: "default",
  LLENA: "outline",
  GANADORA_SELECCIONADA: "default",
  ENTREGADA: "secondary",
  CANCELADA: "destructive",
};

type Props = {
  dinamicas: DinamicaRow[];
  esAdmin: boolean;
};

export function DinamicasTable({ dinamicas: inicial, esAdmin }: Props) {
  const router = useRouter();
  const [dinamicas, setDinamicas] = useState(inicial);
  const [search, setSearch] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusDinamica | "TODAS">(
    "TODAS"
  );
  const [, startTransition] = useTransition();

  const filtradas = useMemo(() => {
    return dinamicas.filter((d) => {
      if (filtroEstatus !== "TODAS" && d.estatus !== filtroEstatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.nombre.toLowerCase().includes(q) ||
          TIPO_DINAMICA_LABEL[d.tipo].toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dinamicas, search, filtroEstatus]);

  const conteos = useMemo(() => {
    const c: Partial<Record<EstatusDinamica, number>> = {};
    for (const d of dinamicas) {
      c[d.estatus] = (c[d.estatus] || 0) + 1;
    }
    return c;
  }, [dinamicas]);

  function handleActivar(id: string, nombre: string) {
    if (!confirm(`¿Activar "${nombre}"? Las clientas podrán ver y comprar boletos.`))
      return;

    startTransition(async () => {
      const res = await fetch(`/api/admin/dinamicas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ estatus: "ACTIVA" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("No se pudo activar", { description: err.error });
        return;
      }

      toast.success("Dinámica activada");
      setDinamicas((prev) =>
        prev.map((d) => (d.id === id ? { ...d, estatus: "ACTIVA" as const } : d))
      );
      router.refresh();
    });
  }

  function handleEliminar(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`))
      return;

    startTransition(async () => {
      const res = await fetch(`/api/admin/dinamicas/${id}`, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("No se pudo eliminar", { description: err.error });
        return;
      }

      toast.success("Dinámica eliminada");
      setDinamicas((prev) => prev.filter((d) => d.id !== id));
    });
  }

  const estatusTabs: (EstatusDinamica | "TODAS")[] = [
    "TODAS",
    "BORRADOR",
    "ACTIVA",
    "LLENA",
    "GANADORA_SELECCIONADA",
    "ENTREGADA",
    "CANCELADA",
  ];

  return (
    <div className="space-y-4">
      {/* Tabs de estatus */}
      <div className="flex flex-wrap gap-2">
        {estatusTabs.map((est) => (
          <button
            key={est}
            onClick={() => setFiltroEstatus(est)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filtroEstatus === est
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            {est === "TODAS" ? "Todas" : ESTATUS_DINAMICA_LABEL[est]}
            {est === "TODAS" ? ` (${dinamicas.length})` : conteos[est] ? ` (${conteos[est]})` : ""}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar dinámica..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Tabla */}
      {filtradas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Ticket className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">No se encontraron dinámicas</p>
          {esAdmin && (
            <Link
              href="/dashboard/dinamicas/nueva"
              className={cn(buttonVariants({ size: "sm" }), "mt-4")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear primera dinámica
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full">
            <thead className="border-b bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Dinámica</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-center">Boletos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Premio</th>
                {esAdmin && (
                  <th className="px-4 py-3 text-right">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtradas.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/dinamicas/${d.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {d.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {TIPO_DINAMICA_LABEL[d.tipo]}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatearMxn(d.precioBoleto)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium">{d._count.boletos}</span>
                    <span className="text-muted-foreground">
                      /{d.totalBoletos}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ESTATUS_VARIANT[d.estatus]}>
                      {ESTATUS_DINAMICA_LABEL[d.estatus]}
                    </Badge>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-sm">
                    {d.productoPremio?.nombre ?? d.premioCustom ?? "—"}
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/dashboard/dinamicas/${d.id}`}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "icon",
                          })}
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {d.estatus === "BORRADOR" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Activar"
                              onClick={() => handleActivar(d.id, d.nombre)}
                            >
                              <Play className="h-4 w-4 text-green-600" />
                            </Button>
                            <Link
                              href={`/dashboard/dinamicas/${d.id}/editar`}
                              className={buttonVariants({
                                variant: "ghost",
                                size: "icon",
                              })}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Eliminar"
                              onClick={() => handleEliminar(d.id, d.nombre)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
