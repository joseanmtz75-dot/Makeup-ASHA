import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Sparkles, Gift, ShoppingBag, Trophy, Ticket } from "lucide-react";
import { formatearMxn } from "@/lib/utils/dineroMxn";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Últimas ganadoras (hasta 2) y dinámica activa más reciente
  const [ganadoras, dinamicaActiva] = await Promise.all([
    prisma.dinamica.findMany({
      where: {
        estatus: { in: ["GANADORA_SELECCIONADA", "ENTREGADA"] },
        clientaGanadoraId: { not: null },
      },
      select: {
        id: true,
        nombre: true,
        esHistorico: true,
        boletoGanador: true,
        totalBoletos: true,
        precioBoleto: true,
        premioCustom: true,
        imagenPremioUrl: true,
        sorteadoEn: true,
        creadoEn: true,
        productoPremio: {
          select: {
            nombre: true,
            imagenes: { select: { url: true }, orderBy: { orden: "asc" }, take: 1 },
          },
        },
        clientaGanadora: { select: { nombre: true } },
      },
      orderBy: [{ sorteadoEn: "desc" }, { creadoEn: "desc" }],
      take: 2,
    }),
    prisma.dinamica.findFirst({
      where: { estatus: "ACTIVA" },
      select: {
        id: true,
        nombre: true,
        precioBoleto: true,
        totalBoletos: true,
        premioCustom: true,
        imagenPremioUrl: true,
        productoPremio: {
          select: {
            nombre: true,
            imagenes: { select: { url: true }, orderBy: { orden: "asc" }, take: 1 },
          },
        },
        _count: {
          select: {
            boletos: { where: { estatus: "CONFIRMADO" } },
          },
        },
      },
      orderBy: [{ inicioEn: "desc" }, { creadoEn: "desc" }],
    }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Maquillaje accesible para todas
          </div>

          <h1 className="mb-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Belleza al alcance,{" "}
            <span className="text-primary">emoción garantizada</span>
          </h1>

          <p className="mb-8 max-w-xl text-lg text-muted-foreground">
            Descubre nuestro catálogo de maquillaje, participa en dinámicas con
            premios increíbles y forma parte de nuestra comunidad ASHA.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/catalogo" className={buttonVariants({ size: "lg" })}>
              <ShoppingBag className="mr-2 h-5 w-5" />
              Ver catálogo
            </Link>
            <Link
              href="/dinamicas"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              <Gift className="mr-2 h-5 w-5" />
              Dinámicas activas
            </Link>
          </div>
        </div>
      </section>

      {/* Dinámica activa */}
      {dinamicaActiva && (
        <section className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 text-center">
              <Badge className="mb-2">Participa ahora</Badge>
              <h2 className="text-3xl font-bold">Dinámica activa</h2>
            </div>
            <Card className="overflow-hidden border-primary/30">
              <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row">
                {(dinamicaActiva.imagenPremioUrl ??
                  dinamicaActiva.productoPremio?.imagenes[0]?.url) && (
                  <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={
                        dinamicaActiva.imagenPremioUrl ??
                        dinamicaActiva.productoPremio!.imagenes[0].url
                      }
                      alt={
                        dinamicaActiva.premioCustom ??
                        dinamicaActiva.productoPremio?.nombre ??
                        "Premio"
                      }
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <h3 className="text-2xl font-bold">
                    {dinamicaActiva.nombre}
                  </h3>
                  <p className="text-muted-foreground">
                    Premio:{" "}
                    <strong>
                      {dinamicaActiva.premioCustom ??
                        dinamicaActiva.productoPremio?.nombre ??
                        "Por definir"}
                    </strong>
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Ticket className="h-4 w-4 text-primary" />
                      {dinamicaActiva._count.boletos}/
                      {dinamicaActiva.totalBoletos} boletos
                    </span>
                    <span>
                      {formatearMxn(dinamicaActiva.precioBoleto)} c/u
                    </span>
                  </div>
                  <Link
                    href={`/dinamicas/${dinamicaActiva.id}`}
                    className={buttonVariants({ size: "lg" })}
                  >
                    Elegir mi número
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Ganadoras recientes */}
      {ganadoras.length > 0 && (
        <section className="border-y border-border/40 bg-muted/20">
          <div className="container mx-auto px-4 py-12">
            <div className="mb-8 text-center">
              <h2 className="flex items-center justify-center gap-2 text-3xl font-bold">
                <Trophy className="h-8 w-8 text-amber-500" />
                Ganadoras recientes
              </h2>
              <p className="mt-2 text-muted-foreground">
                Comunidad real, premios reales
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
              {ganadoras.map((g) => {
                const nombre = g.clientaGanadora?.nombre ?? "Participante";
                const partes = nombre.split(" ");
                const alias =
                  partes.length > 1
                    ? `${partes[0]} ${partes[1][0]}.`
                    : partes[0];
                const premio =
                  g.premioCustom ?? g.productoPremio?.nombre ?? "Premio";
                const imagen =
                  g.imagenPremioUrl ?? g.productoPremio?.imagenes[0]?.url;
                return (
                  <Card key={g.id} className="overflow-hidden">
                    <CardContent className="flex gap-4 pt-6">
                      {imagen && (
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={imagen}
                            alt={premio}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">{g.nombre}</h3>
                          {g.esHistorico && (
                            <Badge
                              variant="outline"
                              className="border-amber-500 text-xs text-amber-700"
                            >
                              Histórica
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">
                          <Trophy className="mr-1 inline h-3 w-3 text-amber-500" />
                          <strong>{alias}</strong>
                          {g.boletoGanador && (
                            <span className="text-muted-foreground">
                              {" "}
                              — boleto #{g.boletoGanador}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Premio: {premio}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/historial"
                className={buttonVariants({ variant: "outline" })}
              >
                Ver todo el historial
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Por qué ASHA */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-10 text-center text-3xl font-bold">¿Por qué ASHA?</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border/40 bg-card p-6">
            <ShoppingBag className="mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Precios accesibles</h3>
            <p className="text-sm text-muted-foreground">
              Maquillaje de calidad sin gastar de más. Promociones constantes
              para que nunca te quedes sin tus favoritos.
            </p>
          </div>

          <div className="rounded-lg border border-border/40 bg-card p-6">
            <Gift className="mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Dinámicas con premios</h3>
            <p className="text-sm text-muted-foreground">
              Participa con tu número de la suerte y gana productos exclusivos.
              Todo transparente y verificable.
            </p>
          </div>

          <div className="rounded-lg border border-border/40 bg-card p-6">
            <Sparkles className="mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Entrega local</h3>
            <p className="text-sm text-muted-foreground">
              Servicio en Tonalá, Zapopan, Guadalajara y Tlaquepaque. Atención
              personalizada por WhatsApp.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
