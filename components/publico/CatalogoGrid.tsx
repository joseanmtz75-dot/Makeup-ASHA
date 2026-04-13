"use client";

import { useState, useMemo } from "react";
import { CategoriaProducto } from "@prisma/client";
import { CATEGORIAS_LABEL } from "@/lib/constants/categorias";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Package } from "lucide-react";
import { ProductoCard, type ProductoPublico } from "./ProductoCard";
import { QuickViewModal } from "./QuickViewModal";

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
  const [quickViewProduct, setQuickViewProduct] =
    useState<ProductoPublico | null>(null);

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
      {/* Search */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <Input
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-primary/20 pl-9 focus:border-primary"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoriaActiva("TODAS")}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition",
            categoriaActiva === "TODAS"
              ? "border-primary bg-primary text-white"
              : "border-primary/30 bg-white text-primary hover:bg-primary/5"
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
                ? "border-primary bg-primary text-white"
                : "border-primary/30 bg-white text-primary hover:bg-primary/5"
            )}
          >
            {CATEGORIAS_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-primary/20 p-12 text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-primary/20" />
          <p className="text-foreground/50">No se encontraron productos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {filtrados.map((producto) => (
            <ProductoCard
              key={producto.id}
              producto={producto}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>
      )}

      {/* Quick View */}
      <QuickViewModal
        producto={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}
