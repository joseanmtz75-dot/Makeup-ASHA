import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getConfiguracion } from "@/lib/config";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Gift, Sparkles, Trophy, Ticket } from "lucide-react";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { HeroPublico } from "@/components/publico/HeroPublico";
import { ProductosDestacados } from "@/components/publico/ProductosDestacados";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [ganadoras, dinamicaActiva, productosDestacados, config] =
    await Promise.all([
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
              imagenes: {
                select: { url: true },
                orderBy: { orden: "asc" as const },
                take: 1,
              },
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
              imagenes: {
                select: { url: true },
                orderBy: { orden: "asc" as const },
                take: 1,
              },
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
      prisma.producto.findMany({
        where: { activo: true, destacado: true },
        select: {
          id: true,
          nombre: true,
          precio: true,
          stock: true,
          categoria: true,
          destacado: true,
          descripcion: true,
          variantes: true,
          imagenes: {
            select: { url: true },
            orderBy: { orden: "asc" as const },
            take: 5,
          },
        },
        orderBy: { creadoEn: "desc" },
        take: 8,
      }),
      getConfiguracion(),
    ]);

  return (
    <>
      {/* Hero */}
      <HeroPublico
        slogan={config.heroTitulo || "Tu glow empieza aquí"}
        subtitulo={config.heroSubtitulo}
      />

      {/* Productos destacados */}
      <ProductosDestacados productos={productosDestacados} />

      {/* Dinámica activa */}
      {dinamicaActiva && (
        <section className="bg-brand-rosa-claro/50">
          <div className="container mx-auto px-4 py-14">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 text-center">
                <Badge className="mb-2 bg-primary text-white border-0">
                  Participa ahora
                </Badge>
                <h2 className="font-serif text-3xl italic font-bold">
                  Dinámica activa
                </h2>
              </div>
              <Card className="overflow-hidden border-primary/20 bg-white">
                <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row">
                  {(dinamicaActiva.imagenPremioUrl ??
                    dinamicaActiva.productoPremio?.imagenes[0]?.url) && (
                    <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-xl">
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
                    <p className="text-foreground/60">
                      Premio:{" "}
                      <strong className="text-foreground">
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
                      <span className="font-semibold text-primary">
                        {formatearMxn(dinamicaActiva.precioBoleto)} c/u
                      </span>
                    </div>
                    <Link
                      href={`/dinamicas/${dinamicaActiva.id}`}
                      className={buttonVariants({
                        size: "lg",
                        className: "rounded-full",
                      })}
                    >
                      Elegir mi número
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Ganadoras recientes */}
      {ganadoras.length > 0 && (
        <section className="container mx-auto px-4 py-14">
          <div className="mb-8 text-center">
            <h2 className="flex items-center justify-center gap-2 font-serif text-3xl italic font-bold">
              <Trophy className="h-7 w-7 text-brand-gold" />
              Ganadoras recientes
            </h2>
            <p className="mt-2 text-foreground/50">
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
                <Card
                  key={g.id}
                  className="overflow-hidden border-primary/10 bg-white"
                >
                  <CardContent className="flex gap-4 pt-6">
                    {imagen && (
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
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
                            className="border-brand-gold text-xs text-brand-gold"
                          >
                            Histórica
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">
                        <Trophy className="mr-1 inline h-3 w-3 text-brand-gold" />
                        <strong>{alias}</strong>
                        {g.boletoGanador && (
                          <span className="text-foreground/50">
                            {" "}
                            — boleto #{g.boletoGanador}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-foreground/50">
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
              className={buttonVariants({
                variant: "outline",
                className: "rounded-full border-primary/30 text-primary",
              })}
            >
              Ver todo el historial
            </Link>
          </div>
        </section>
      )}

      {/* Por qué Makeup Asha */}
      <section id="nosotros" className="bg-brand-rosa-claro/50">
        <div className="container mx-auto px-4 py-16">
          <h2 className="mb-10 text-center font-serif text-3xl italic font-bold">
            ¿Por qué Makeup Asha?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-primary/10 bg-white p-6">
              <ShoppingBag className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Precios accesibles</h3>
              <p className="text-sm text-foreground/60">
                Maquillaje de calidad sin gastar de más. Promociones constantes
                para que nunca te quedes sin tus favoritos.
              </p>
            </div>

            <div className="rounded-xl border border-primary/10 bg-white p-6">
              <Gift className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">
                Dinámicas con premios
              </h3>
              <p className="text-sm text-foreground/60">
                Participa con tu número de la suerte y gana productos exclusivos.
                Todo transparente y verificable.
              </p>
            </div>

            <div className="rounded-xl border border-primary/10 bg-white p-6">
              <Sparkles className="mb-3 h-8 w-8 text-brand-gold" />
              <h3 className="mb-2 text-lg font-semibold">Entrega local</h3>
              <p className="text-sm text-foreground/60">
                Servicio en Tonalá, Zapopan, Guadalajara y Tlaquepaque. Atención
                personalizada por WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
