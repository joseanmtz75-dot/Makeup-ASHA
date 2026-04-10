"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Ticket,
  Star,
  Clock,
  ShieldCheck,
  Trophy,
  Flame,
} from "lucide-react";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { TIPO_DINAMICA_LABEL } from "@/lib/constants/dinamicas";
import { cn } from "@/lib/utils";
import { CheckoutBoletos } from "./CheckoutBoletos";
import type { TipoDinamica, EstatusDinamica, EstatusBoleto } from "@prisma/client";

type BoletoPublico = {
  numero: number;
  estatus: EstatusBoleto;
};

type DinamicaData = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoDinamica;
  precioBoleto: number;
  totalBoletos: number;
  estatus: EstatusDinamica;
  hashSeed: string | null;
  seedGanadora: string | null;
  boletoGanador: number | null;
  sorteadoEn: string | null;
  inicioEn: string | null;
  cierreEn: string | null;
  imagenPremioUrl: string | null;
  premioCustom: string | null;
  productoPremio: {
    id: string;
    nombre: string;
    precio: number;
    descripcion: string | null;
    imagenes: { url: string }[];
  } | null;
  ganadora: string | null;
  boletos: BoletoPublico[];
};

export function DinamicaPublica({ dinamica }: { dinamica: DinamicaData }) {
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [checkoutAbierto, setCheckoutAbierto] = useState(false);

  const premio =
    dinamica.premioCustom ?? dinamica.productoPremio?.nombre ?? "Premio";
  const imagenPremio =
    dinamica.imagenPremioUrl ??
    dinamica.productoPremio?.imagenes[0]?.url ??
    null;

  const stats = useMemo(() => {
    let disponibles = 0;
    let ocupados = 0;
    for (const b of dinamica.boletos) {
      if (b.estatus === "DISPONIBLE") disponibles++;
      else if (b.estatus !== "CANCELADO") ocupados++;
    }
    return { disponibles, ocupados };
  }, [dinamica.boletos]);

  const progreso = Math.round(
    (stats.ocupados / dinamica.totalBoletos) * 100
  );

  function toggleNumero(num: number) {
    const boleto = dinamica.boletos.find((b) => b.numero === num);
    if (!boleto || boleto.estatus !== "DISPONIBLE") return;

    setSeleccionados((prev) => {
      if (prev.includes(num)) return prev.filter((n) => n !== num);
      if (prev.length >= 10) return prev;
      return [...prev, num];
    });
  }

  const total = seleccionados.length * dinamica.precioBoleto;
  const yaTerminada =
    dinamica.estatus === "GANADORA_SELECCIONADA" ||
    dinamica.estatus === "ENTREGADA" ||
    dinamica.estatus === "CANCELADA";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge className="bg-primary">
              {TIPO_DINAMICA_LABEL[dinamica.tipo]}
            </Badge>
            {dinamica.estatus === "LLENA" && (
              <Badge variant="destructive">LLENA</Badge>
            )}
            {yaTerminada && dinamica.estatus !== "CANCELADA" && (
              <Badge variant="secondary">Finalizada</Badge>
            )}
            {dinamica.estatus === "CANCELADA" && (
              <Badge variant="destructive">Cancelada</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">{dinamica.nombre}</h1>
          {dinamica.descripcion && (
            <p className="mt-2 text-muted-foreground">{dinamica.descripcion}</p>
          )}
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold text-primary">
            {formatearMxn(dinamica.precioBoleto)}
          </div>
          <p className="text-sm text-muted-foreground">por boleto</p>
        </div>
      </div>

      {/* Premio */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row">
          {imagenPremio && (
            <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl">
              <Image
                src={imagenPremio}
                alt={premio}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold">Premio</h2>
            </div>
            <p className="mt-1 text-lg">{premio}</p>
            {dinamica.productoPremio?.precio && (
              <p className="text-sm text-muted-foreground">
                Valor: {formatearMxn(dinamica.productoPremio.precio)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultado (si ya hay ganadora) */}
      {dinamica.ganadora && dinamica.boletoGanador && (
        <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardContent className="pt-6 text-center">
            <Trophy className="mx-auto mb-2 h-10 w-10 text-amber-500" />
            <h2 className="text-2xl font-bold text-amber-800">
              Ganadora: {dinamica.ganadora}
            </h2>
            <p className="text-amber-700">
              Numero ganador: <strong>#{dinamica.boletoGanador}</strong>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Progreso */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm">
            <span>
              <Ticket className="mr-1 inline h-4 w-4" />
              {stats.ocupados} de {dinamica.totalBoletos} vendidos
            </span>
            <span className="font-bold">{progreso}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progreso >= 80 ? "bg-red-500" : "bg-primary"
              )}
              style={{ width: `${progreso}%` }}
            />
          </div>
          {stats.disponibles > 0 && !yaTerminada && (
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              {progreso >= 80 && <Flame className="h-4 w-4 text-red-500" />}
              {stats.disponibles} boletos disponibles
            </p>
          )}

          {dinamica.cierreEn && (
            <p className="mt-2 flex items-center gap-1 text-sm text-amber-600">
              <Clock className="h-4 w-4" />
              Cierra:{" "}
              {new Date(dinamica.cierreEn).toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Grid de números */}
      <Card>
        <CardHeader>
          <CardTitle>
            {yaTerminada
              ? "Números"
              : "Elige tu número de la suerte"}
          </CardTitle>
          {!yaTerminada && stats.disponibles > 0 && (
            <p className="text-sm text-muted-foreground">
              Toca los números que quieres. Puedes elegir hasta 10.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {dinamica.boletos.map((b) => {
              const seleccionado = seleccionados.includes(b.numero);
              const disponible =
                b.estatus === "DISPONIBLE" && !yaTerminada;
              const esGanador = b.numero === dinamica.boletoGanador;

              return (
                <button
                  key={b.numero}
                  type="button"
                  disabled={!disponible && !seleccionado}
                  onClick={() => toggleNumero(b.numero)}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-lg border text-sm font-bold transition-all",
                    disponible && !seleccionado &&
                      "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5",
                    seleccionado &&
                      "border-primary bg-primary text-primary-foreground scale-105 shadow-md",
                    b.estatus !== "DISPONIBLE" &&
                      !seleccionado &&
                      "border-muted bg-muted/50 text-muted-foreground/40 cursor-not-allowed",
                    esGanador && "ring-2 ring-amber-500 ring-offset-1"
                  )}
                >
                  {b.numero}
                  {esGanador && (
                    <Trophy className="absolute -right-1 -top-1 h-3 w-3 text-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded border border-border bg-background" />
              Disponible
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-primary" />
              Tu selección
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-muted" />
              Ocupado
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Barra de acción sticky */}
      {seleccionados.length > 0 && !yaTerminada && (
        <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">
                {seleccionados.length}{" "}
                {seleccionados.length === 1 ? "boleto" : "boletos"} —{" "}
                {formatearMxn(total)}
              </p>
              <p className="text-xs text-muted-foreground">
                Números: {seleccionados.sort((a, b) => a - b).join(", ")}
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setCheckoutAbierto(true)}
              className="text-lg"
            >
              Participar
            </Button>
          </div>
        </div>
      )}

      {/* Verificación */}
      {dinamica.hashSeed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4" />
              Transparencia verificable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <p className="text-muted-foreground">
              Antes de iniciar, se generó una semilla secreta cuyo hash
              (huella digital) es público. Al terminar, la semilla se revela
              para que cualquiera pueda verificar que el resultado es justo.
            </p>
            <p className="mt-2 font-mono">
              <span className="text-muted-foreground">Hash público: </span>
              <span className="break-all">{dinamica.hashSeed}</span>
            </p>
            {dinamica.seedGanadora && (
              <>
                <p className="font-mono">
                  <span className="text-muted-foreground">Semilla: </span>
                  {dinamica.seedGanadora}
                </p>
                <p className="font-mono">
                  <span className="text-muted-foreground">Timestamp: </span>
                  {dinamica.sorteadoEn}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de checkout */}
      <CheckoutBoletos
        open={checkoutAbierto}
        onClose={() => setCheckoutAbierto(false)}
        dinamicaId={dinamica.id}
        dinamicaNombre={dinamica.nombre}
        numeros={seleccionados}
        precioBoleto={dinamica.precioBoleto}
        total={total}
      />
    </div>
  );
}
