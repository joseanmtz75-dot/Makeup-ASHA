"use client";

import { useState } from "react";
import { ProductoCard, type ProductoPublico } from "./ProductoCard";
import { QuickViewModal } from "./QuickViewModal";

export function ProductosDestacados({
  productos,
}: {
  productos: ProductoPublico[];
}) {
  const [quickViewProduct, setQuickViewProduct] =
    useState<ProductoPublico | null>(null);

  if (productos.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-14">
      <div className="mb-8 text-center">
        <h2 className="font-serif text-3xl italic font-bold text-foreground">
          Productos destacados
        </h2>
        <p className="mt-2 text-foreground/50">
          Lo que más les encanta a nuestras clientas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {productos.map((p) => (
          <ProductoCard
            key={p.id}
            producto={p}
            onQuickView={setQuickViewProduct}
          />
        ))}
      </div>

      <QuickViewModal
        producto={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  );
}
