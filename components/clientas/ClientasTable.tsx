"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Clienta, NivelClienta } from "@prisma/client";
import { MUNICIPIOS_LABEL } from "@/lib/constants/municipios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil, Trash2, Users, Phone, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type ClientaConCount = Clienta & {
  _count: { compras: number };
};

const NIVEL_COLOR: Record<NivelClienta, string> = {
  BRONCE: "bg-amber-100 text-amber-900 border-amber-200",
  PLATA: "bg-slate-100 text-slate-900 border-slate-300",
  ORO: "bg-yellow-100 text-yellow-900 border-yellow-300",
};

function formatTelefono(tel: string) {
  if (tel.length !== 10) return tel;
  return `${tel.slice(0, 2)} ${tel.slice(2, 6)} ${tel.slice(6)}`;
}

export function ClientasTable({
  clientas: clientasIniciales,
  esAdmin,
}: {
  clientas: ClientaConCount[];
  esAdmin: boolean;
}) {
  const [clientas, setClientas] = useState(clientasIniciales);
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();

  const filtradas = clientas.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.telefono.includes(q.replace(/\D/g, "")) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  function handleEliminar(id: string, nombre: string, comprasCount: number) {
    if (comprasCount > 0) {
      toast.error("No se puede eliminar una clienta con compras asociadas");
      return;
    }
    if (!confirm(`¿Eliminar a ${nombre}?`)) return;

    startTransition(async () => {
      const res = await fetch(`/api/admin/clientas/${id}`, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      if (!res.ok) {
        toast.error("No se pudo eliminar");
        return;
      }
      toast.success("Clienta eliminada");
      setClientas((prev) => prev.filter((c) => c.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por nombre, teléfono o email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {filtradas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {clientas.length === 0
              ? "Aún no hay clientas registradas"
              : "No se encontraron clientas con esa búsqueda"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full">
            <thead className="border-b bg-muted/30 text-left text-xs font-medium uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Municipio</th>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3 text-right">Compras</th>
                <th className="px-4 py-3 text-right">Puntos</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtradas.map((clienta) => (
                <tr key={clienta.id} className="transition hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{clienta.nombre}</td>
                  <td className="px-4 py-3 text-sm">
                    <a
                      href={`tel:+52${clienta.telefono}`}
                      className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
                    >
                      <Phone className="h-3 w-3" />
                      {formatTelefono(clienta.telefono)}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {clienta.municipio
                      ? MUNICIPIOS_LABEL[clienta.municipio]
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-block rounded-full border px-2 py-0.5 text-xs font-medium",
                        NIVEL_COLOR[clienta.nivelActual]
                      )}
                    >
                      {clienta.nivelActual}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {clienta._count.compras}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {clienta.puntos}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/dashboard/clientas/${clienta.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/dashboard/clientas/${clienta.id}/editar`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {esAdmin && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            handleEliminar(
                              clienta.id,
                              clienta.nombre,
                              clienta._count.compras
                            )
                          }
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
