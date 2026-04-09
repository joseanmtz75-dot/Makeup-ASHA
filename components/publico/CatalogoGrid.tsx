"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { CategoriaProducto } from "@prisma/client";
import { CATEGORIAS_LABEL } from "@/lib/constants/categorias";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, Package, Star } from "lucide-react";

type ProductoPublico = {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: CategoriaProducto;
  destacado: boolean;
  imagenes: { url: string }[];
};

export function CatalogoGrid({
  productosIniciales,
  categoriaInicial,
  searchInicial,
}: {
  productosIniciales: ProductoPublico[];
  categoriaInicial?: string;
  searchInicial?: string;
}) {
  const [search, setSearch] = useState(searchInicial || "");
  const [categoriaActiva, setCategoriaActiva] = useState<
    CategoriaProducto | "TODAS"
  >((categoriaInicial as CategoriaProducto) || "TODAS");

  const filtrados = useMemo(() => {
    return productosIniciales.filter((p) => {
      if (categoriaActiva !== "TODAS" && p.categoria !== categoriaActiva)
        return false;
      if (search) {
        return p.nombre.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    });
  }, [productosIniciales, search, categoriaActiva]);

  const categoriasDisponibles = useMemo(() => {
    const set = new Set<CategoriaProducto>();
    productosIniciales.forEach((p) => set.add(p.categoria));
    return Array.from(set);
  }, [productosIniciales]);

  return (
    <>
      {/* Barra de búsqueda */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filtros de categoría */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoriaActiva("TODAS")}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition",
            categoriaActiva === "TODAS"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted"
          )}
        >
          Todas
        </button>
        {categoriasDisponibles.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              categoriaActiva === cat
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            {CATEGORIAS_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      {filtrados.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            No se encontraron productos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {filtrados.map((producto) => (
            <Link
              key={producto.id}
              href={`/catalogo/${producto.id}`}
              className="group flex flex-col overflow-hidden rounded-lg border bg-card transition hover:border-primary hover:shadow-md"
            >
              <div className="relative aspect-square bg-muted">
                {producto.imagenes[0] ? (
                  <Image
                    src={producto.imagenes[0].url}
                    alt={producto.nombre}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <Package className="absolute inset-0 m-auto h-12 w-12 text-muted-foreground/30" />
                )}
                {producto.destacado && (
                  <Badge
                    variant="default"
                    className="absolute left-2 top-2 gap-1"
                  >
                    <Star className="h-3 w-3" />
                    Destacado
                  </Badge>
                )}
                {producto.stock === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Badge variant="destructive">Agotado</Badge>
                  </div>
                )}
                {producto.stock > 0 && producto.stock < 5 && (
                  <Badge
                    variant="secondary"
                    className="absolute right-2 top-2"
                  >
                    Quedan {producto.stock}
                  </Badge>
                )}
              </div>

              <div className="flex flex-1 flex-col p-3">
                <div className="mb-1 text-xs text-muted-foreground">
                  {CATEGORIAS_LABEL[producto.categoria]}
                </div>
                <h3 className="mb-2 line-clamp-2 flex-1 text-sm font-semibold leading-tight">
                  {producto.nombre}
                </h3>
                <div className="text-lg font-bold text-primary">
                  {formatearMxn(producto.precio)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
