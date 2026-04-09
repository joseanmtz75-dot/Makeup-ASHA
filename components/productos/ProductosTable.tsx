"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Producto, ImagenProducto } from "@prisma/client";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { CATEGORIAS_LABEL } from "@/lib/constants/categorias";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil, Trash2, Package } from "lucide-react";

type ProductoConImagenes = Producto & { imagenes: ImagenProducto[] };

export function ProductosTable({
  productos: productosIniciales,
  esAdmin,
}: {
  productos: ProductoConImagenes[];
  esAdmin: boolean;
}) {
  const [productos, setProductos] = useState(productosIniciales);
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();

  const filtrados = productos.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      CATEGORIAS_LABEL[p.categoria].toLowerCase().includes(q)
    );
  });

  function handleEliminar(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"? Si tiene compras asociadas se desactivará en lugar de borrarse.`)) {
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/productos/${id}`, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      if (!res.ok) {
        toast.error("No se pudo eliminar el producto");
        return;
      }

      const data = await res.json();
      if (data.deactivated) {
        toast.success("Producto desactivado (tenía compras asociadas)");
        setProductos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, activo: false } : p))
        );
      } else {
        toast.success("Producto eliminado");
        setProductos((prev) => prev.filter((p) => p.id !== id));
      }
    });
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por nombre, SKU o categoría..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {filtrados.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {productos.length === 0
              ? "Aún no hay productos en el catálogo"
              : "No se encontraron productos con esa búsqueda"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full">
            <thead className="border-b bg-muted/30 text-left text-xs font-medium uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Estado</th>
                {esAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.map((producto) => (
                <tr key={producto.id} className="transition hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        {producto.imagenes[0] ? (
                          <Image
                            src={producto.imagenes[0].url}
                            alt={producto.nombre}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <Package className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground/40" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{producto.nombre}</div>
                        {producto.sku && (
                          <div className="text-xs text-muted-foreground">
                            SKU: {producto.sku}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {CATEGORIAS_LABEL[producto.categoria]}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatearMxn(producto.precio)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        producto.stock === 0
                          ? "font-semibold text-destructive"
                          : producto.stock < 5
                            ? "font-semibold text-amber-600"
                            : ""
                      }
                    >
                      {producto.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {producto.activo ? (
                      <Badge variant="default">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                    {producto.destacado && (
                      <Badge variant="outline" className="ml-1">
                        Destacado
                      </Badge>
                    )}
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/productos/${producto.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            handleEliminar(producto.id, producto.nombre)
                          }
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
