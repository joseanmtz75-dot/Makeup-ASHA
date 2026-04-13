"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckoutUnificado } from "@/components/publico/CheckoutUnificado";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { CATEGORIAS_LABEL } from "@/lib/constants/categorias";
import { ShoppingCart, ExternalLink, Package } from "lucide-react";
import type { ProductoPublico } from "./ProductoCard";

type VarianteProducto = {
  nombre: string;
  colorHex?: string;
};

function parseVariantes(raw: unknown): VarianteProducto[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (v): v is VarianteProducto =>
      typeof v === "object" && v !== null && typeof v.nombre === "string"
  );
}

type Props = {
  producto: ProductoPublico | null;
  open: boolean;
  onClose: () => void;
};

export function QuickViewModal({ producto, open, onClose }: Props) {
  const [imagenActiva, setImagenActiva] = useState(0);

  if (!producto) return null;

  const variantes = parseVariantes(producto.variantes);
  const agotado = producto.stock === 0;
  const imagenes = producto.imagenes;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          onClose();
          setImagenActiva(0);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="grid gap-0 sm:grid-cols-2">
          {/* Image gallery */}
          <div className="relative bg-brand-rosa-claro/50">
            <div className="relative aspect-square">
              {imagenes[imagenActiva] ? (
                <Image
                  src={imagenes[imagenActiva].url}
                  alt={producto.nombre}
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover"
                />
              ) : (
                <Package className="absolute inset-0 m-auto h-16 w-16 text-primary/20" />
              )}
            </div>
            {imagenes.length > 1 && (
              <div className="flex gap-1.5 p-2">
                {imagenes.map((img, idx) => (
                  <button
                    key={img.url}
                    onClick={() => setImagenActiva(idx)}
                    className={`relative h-12 w-12 overflow-hidden rounded-md border-2 transition ${
                      idx === imagenActiva
                        ? "border-primary"
                        : "border-transparent hover:border-primary/30"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${producto.nombre} ${idx + 1}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col p-5">
            <DialogHeader className="mb-3 text-left">
              <span className="mb-1 text-xs font-medium uppercase tracking-wider text-foreground/40">
                {CATEGORIAS_LABEL[producto.categoria]}
              </span>
              <DialogTitle className="font-serif text-xl italic leading-tight">
                {producto.nombre}
              </DialogTitle>
            </DialogHeader>

            <span className="mb-3 text-2xl font-bold text-primary">
              {formatearMxn(producto.precio)}
            </span>

            {producto.descripcion && (
              <p className="mb-4 text-sm leading-relaxed text-foreground/60">
                {producto.descripcion.length > 200
                  ? producto.descripcion.slice(0, 200) + "..."
                  : producto.descripcion}
              </p>
            )}

            {/* Variantes */}
            {variantes.length > 0 && (
              <div className="mb-4">
                <span className="mb-2 block text-xs font-medium text-foreground/50">
                  Colores disponibles
                </span>
                <div className="flex flex-wrap gap-2">
                  {variantes.map((v) => (
                    <span
                      key={v.nombre}
                      className="flex items-center gap-1.5 rounded-full border border-foreground/10 px-2.5 py-1 text-xs"
                    >
                      {v.colorHex && (
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-foreground/10"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      {v.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stock badge */}
            <div className="mb-4">
              {agotado ? (
                <Badge variant="destructive">Agotado</Badge>
              ) : producto.stock < 5 ? (
                <Badge className="bg-amber-500 text-white border-0">
                  Solo quedan {producto.stock}
                </Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800 border-0">
                  Disponible
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-col gap-2">
              {!agotado && (
                <CheckoutUnificado
                  tipo="producto"
                  producto={producto}
                  trigger={
                    <Button size="lg" className="w-full">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Añadir al carrito
                    </Button>
                  }
                />
              )}
              <Link
                href={`/catalogo/${producto.id}`}
                onClick={() => onClose()}
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "w-full",
                })}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver detalle completo
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
