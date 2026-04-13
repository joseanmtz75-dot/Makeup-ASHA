"use client";

import Link from "next/link";
import Image from "next/image";
import { CategoriaProducto } from "@prisma/client";
import { CATEGORIAS_LABEL } from "@/lib/constants/categorias";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckoutUnificado } from "@/components/publico/CheckoutUnificado";
import { ShoppingCart, Eye, Package, Star } from "lucide-react";

export type ProductoPublico = {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: CategoriaProducto;
  destacado: boolean;
  descripcion?: string | null;
  variantes?: unknown;
  imagenes: { url: string }[];
};

type Props = {
  producto: ProductoPublico;
  onQuickView?: (producto: ProductoPublico) => void;
};

export function ProductoCard({ producto, onQuickView }: Props) {
  const agotado = producto.stock === 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-primary/10 bg-white transition hover:shadow-lg hover:shadow-primary/5">
      {/* Image — clickable link to detail */}
      <Link
        href={`/catalogo/${producto.id}`}
        className="relative aspect-square overflow-hidden bg-brand-rosa-claro/50"
      >
        {producto.imagenes[0] ? (
          <Image
            src={producto.imagenes[0].url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <Package className="absolute inset-0 m-auto h-12 w-12 text-primary/20" />
        )}

        {/* Badges */}
        {producto.destacado && (
          <Badge className="absolute left-2 top-2 gap-1 bg-brand-gold text-white border-0">
            <Star className="h-3 w-3" />
            Nuevo
          </Badge>
        )}
        {agotado && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Badge variant="destructive" className="text-sm">Agotado</Badge>
          </div>
        )}
        {!agotado && producto.stock > 0 && producto.stock < 5 && (
          <Badge className="absolute right-2 top-2 bg-amber-500 text-white border-0">
            Quedan {producto.stock}
          </Badge>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <span className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-foreground/40">
          {CATEGORIAS_LABEL[producto.categoria]}
        </span>
        <Link
          href={`/catalogo/${producto.id}`}
          className="mb-1 line-clamp-2 text-sm font-semibold leading-tight transition hover:text-primary"
        >
          {producto.nombre}
        </Link>
        <span className="mb-3 text-lg font-bold text-primary">
          {formatearMxn(producto.precio)}
        </span>

        {/* Action buttons */}
        <div className="mt-auto flex gap-2">
          {agotado ? (
            <Button disabled size="sm" className="flex-1 text-xs">
              Agotado
            </Button>
          ) : (
            <CheckoutUnificado
              tipo="producto"
              producto={producto}
              trigger={
                <Button size="sm" className="flex-1 text-xs">
                  <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                  Añadir
                </Button>
              }
            />
          )}
          {onQuickView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickView(producto)}
              className="border-foreground/15 px-2.5 hover:border-primary hover:text-primary"
              title="Vista rápida"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
