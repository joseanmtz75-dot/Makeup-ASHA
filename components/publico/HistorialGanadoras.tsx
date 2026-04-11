"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Trophy, ShieldCheck, Gift } from "lucide-react";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { TIPO_DINAMICA_LABEL } from "@/lib/constants/dinamicas";
import type { TipoDinamica } from "@prisma/client";

type GanadoraPublica = {
  id: string;
  nombre: string;
  tipo: TipoDinamica;
  esHistorico: boolean;
  precioBoleto: number;
  totalBoletos: number;
  boletoGanador: number | null;
  premio: string;
  premioImagen: string | null;
  ganadora: string;
  telefonoCensurado: string;
  sorteadoEn: string | null;
  entregadoEn: string | null;
  verificacion: {
    hashSeed: string | null;
    seed: string | null;
    dinamicaId: string;
    timestampSorteo: string | null;
    totalBoletos: number;
    numeroGanador: number | null;
  };
};

type Props = {
  ganadoras: GanadoraPublica[];
};

export function HistorialGanadoras({ ganadoras }: Props) {
  if (ganadoras.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Trophy className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
        <p className="text-lg font-medium text-muted-foreground">
          Aún no hay ganadoras
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Participa en las dinámicas activas para ser la primera
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ganadoras.map((g) => (
        <Card key={g.id} className="overflow-hidden">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row">
            {/* Imagen del premio */}
            {g.premioImagen && (
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={g.premioImagen}
                  alt={g.premio}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold">{g.nombre}</h3>
                <Badge variant="outline">
                  {TIPO_DINAMICA_LABEL[g.tipo]}
                </Badge>
                {g.esHistorico && (
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-700"
                    title="Dinámica previa al sistema de selección verificable"
                  >
                    Histórica
                  </Badge>
                )}
                {g.entregadoEn && (
                  <Badge variant="secondary">
                    <Gift className="mr-1 h-3 w-3" />
                    Entregado
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{g.ganadora}</span>
                {g.telefonoCensurado && (
                  <span className="text-sm text-muted-foreground">
                    ({g.telefonoCensurado})
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Premio: <strong>{g.premio}</strong> — Boleto ganador:{" "}
                <strong>#{g.boletoGanador}</strong>
              </p>

              <p className="text-xs text-muted-foreground">
                {g.totalBoletos} boletos a{" "}
                {formatearMxn(g.precioBoleto)} c/u —{" "}
                {g.sorteadoEn
                  ? new Date(g.sorteadoEn).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : ""}
              </p>

              {/* Verificación */}
              {g.verificacion.seed && (
                <details className="group">
                  <summary className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                    <ShieldCheck className="h-3 w-3" />
                    Verificar resultado
                  </summary>
                  <div className="mt-2 space-y-1 rounded-lg bg-muted/50 p-3 font-mono text-xs">
                    <p>
                      <span className="text-muted-foreground">Hash: </span>
                      <span className="break-all">
                        {g.verificacion.hashSeed}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Seed: </span>
                      {g.verificacion.seed}
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Timestamp:{" "}
                      </span>
                      {g.verificacion.timestampSorteo}
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Total boletos:{" "}
                      </span>
                      {g.verificacion.totalBoletos}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formula: SHA256(seed + dinamicaId + timestamp) mod
                      totalBoletos + 1 = #{g.verificacion.numeroGanador}
                    </p>
                  </div>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
