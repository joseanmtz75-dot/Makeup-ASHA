"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CategoriaProducto } from "@prisma/client";
import { CATEGORIAS_LABEL } from "@/lib/constants/categorias";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { CheckoutDialog } from "@/components/publico/CheckoutDialog";
import { Package, ArrowLeft, ShoppingCart, MessageCircle } from "lucide-react";
import { normalizarTelefonoMx } from "@/lib/whatsapp";

type Props = {
  producto: {
    id: string;
    nombre: string;
    descripcion: string | null;
    precio: number;
    stock: number;
    categoria: CategoriaProducto;
    imagenes: { url: string; orden: number }[];
  };
  whatsapp?: string | null;
};

export function ProductoDetalle({ producto, whatsapp }: Props) {
  const [imagenActiva, setImagenActiva] = useState(0);
  const agotado = producto.stock === 0;

  const mensajeWp = encodeURIComponent(
    `Hola! Me interesa "${producto.nombre}" de ${formatearMxn(producto.precio)}. ¿Sigue disponible?`
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <Link
        href="/catalogo"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Galería */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
            {producto.imagenes[imagenActiva] ? (
              <Image
                src={producto.imagenes[imagenActiva].url}
                alt={producto.nombre}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            ) : (
              <Package className="absolute inset-0 m-auto h-20 w-20 text-muted-foreground/30" />
            )}
            {agotado && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Badge variant="destructive" className="text-base">
                  Agotado
                </Badge>
              </div>
            )}
          </div>

          {producto.imagenes.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {producto.imagenes.map((img, idx) => (
                <button
                  key={img.url}
                  onClick={() => setImagenActiva(idx)}
                  className={`relative aspect-square overflow-hidden rounded-md border-2 transition ${
                    idx === imagenActiva
                      ? "border-primary"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`${producto.nombre} ${idx + 1}`}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-2 text-sm text-muted-foreground">
            {CATEGORIAS_LABEL[producto.categoria]}
          </div>

          <h1 className="mb-3 text-3xl font-bold md:text-4xl">
            {producto.nombre}
          </h1>

          <div className="mb-4 text-4xl font-bold text-primary">
            {formatearMxn(producto.precio)}
          </div>

          <div className="mb-6">
            {agotado ? (
              <Badge variant="destructive">Agotado</Badge>
            ) : producto.stock < 5 ? (
              <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                ¡Solo quedan {producto.stock}!
              </Badge>
            ) : (
              <Badge variant="default">Disponible</Badge>
            )}
          </div>

          {producto.descripcion && (
            <div className="mb-6 whitespace-pre-wrap text-sm text-muted-foreground">
              {producto.descripcion}
            </div>
          )}

          <div className="mt-auto flex flex-col gap-3">
            {agotado ? (
              <Button disabled size="lg">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Agotado
              </Button>
            ) : (
              <CheckoutDialog
                producto={producto}
                trigger={
                  <Button size="lg">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Pedir ahora
                  </Button>
                }
              />
            )}

            {whatsapp && (
              <a
                href={`https://wa.me/${normalizarTelefonoMx(whatsapp)}?text=${mensajeWp}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Preguntar por WhatsApp
              </a>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Entrega en Tonalá, Zapopan, Guadalajara y Tlaquepaque. Pago por
            transferencia o efectivo contra entrega.
          </p>
        </div>
      </div>
    </div>
  );
}
