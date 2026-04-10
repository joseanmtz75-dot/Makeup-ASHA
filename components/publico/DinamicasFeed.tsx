"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Ticket, Clock, Flame, Star } from "lucide-react";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { TIPO_DINAMICA_LABEL } from "@/lib/constants/dinamicas";
import type { TipoDinamica, EstatusDinamica } from "@prisma/client";

type DinamicaPublica = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoDinamica;
  precioBoleto: number;
  totalBoletos: number;
  estatus: EstatusDinamica;
  inicioEn: string | null;
  cierreEn: string | null;
  imagenPremioUrl: string | null;
  premioCustom: string | null;
  productoPremio: {
    id: string;
    nombre: string;
    precio: number;
    imagenes: { url: string }[];
  } | null;
  boletosVendidos: number;
  boletosDisponibles: number;
};

type Props = {
  dinamicas: DinamicaPublica[];
};

export function DinamicasFeed({ dinamicas }: Props) {
  if (dinamicas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Ticket className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
        <p className="text-lg font-medium text-muted-foreground">
          No hay dinámicas activas por ahora
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Vuelve pronto o síguenos en redes para enterarte primero
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {dinamicas.map((d) => {
        const imagenUrl =
          d.imagenPremioUrl ??
          d.productoPremio?.imagenes[0]?.url ??
          null;
        const premio =
          d.premioCustom ?? d.productoPremio?.nombre ?? "Premio sorpresa";
        const progreso = Math.round(
          (d.boletosVendidos / d.totalBoletos) * 100
        );
        const casiLlena = progreso >= 80;

        return (
          <Link
            key={d.id}
            href={`/dinamicas/${d.id}`}
            className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:border-primary hover:shadow-lg"
          >
            {/* Imagen */}
            <div className="relative aspect-[4/3] bg-muted">
              {imagenUrl ? (
                <Image
                  src={imagenUrl}
                  alt={premio}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Ticket className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute left-2 top-2 flex gap-1">
                <Badge className="bg-primary/90 backdrop-blur-sm">
                  {TIPO_DINAMICA_LABEL[d.tipo]}
                </Badge>
                {casiLlena && (
                  <Badge className="bg-red-500/90 backdrop-blur-sm">
                    <Flame className="mr-1 h-3 w-3" />
                    Casi llena
                  </Badge>
                )}
              </div>

              {d.estatus === "LLENA" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Badge variant="destructive" className="text-lg">
                    LLENA
                  </Badge>
                </div>
              )}

              {/* Precio */}
              <div className="absolute bottom-2 right-2">
                <Badge
                  variant="secondary"
                  className="bg-white/90 text-lg font-bold text-primary backdrop-blur-sm"
                >
                  {formatearMxn(d.precioBoleto)}
                </Badge>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="mb-1 text-lg font-bold leading-tight">
                {d.nombre}
              </h3>

              <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3 w-3" />
                <span>Premio: {premio}</span>
              </div>

              {/* Barra de progreso */}
              <div className="mt-auto">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {d.boletosVendidos} de {d.totalBoletos} boletos
                  </span>
                  <span className="font-bold">{progreso}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      casiLlena ? "bg-red-500" : "bg-primary"
                    }`}
                    style={{ width: `${progreso}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.boletosDisponibles > 0 ? (
                    <>
                      <Ticket className="mr-1 inline h-3 w-3" />
                      {d.boletosDisponibles} disponibles
                    </>
                  ) : (
                    "Sin boletos disponibles"
                  )}
                </p>
              </div>

              {/* Cierre */}
              {d.cierreEn && (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                  <Clock className="h-3 w-3" />
                  Cierra:{" "}
                  {new Date(d.cierreEn).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
