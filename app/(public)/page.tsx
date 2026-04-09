import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Sparkles, Gift, ShoppingBag } from "lucide-react";

export default function HomePage() {
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
