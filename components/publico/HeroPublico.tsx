"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { BowSvg } from "./BowSvg";
import { ShoppingBag, Gift } from "lucide-react";

type Props = {
  slogan?: string | null;
  subtitulo?: string | null;
};

export function HeroPublico({ slogan, subtitulo }: Props) {
  return (
    <section className="relative overflow-hidden bg-brand-rosa-claro">
      {/* Bow decorativo */}
      <BowSvg className="pointer-events-none absolute -right-10 -top-5 h-64 w-64 text-primary md:h-80 md:w-80" />
      <BowSvg className="pointer-events-none absolute -bottom-8 -left-10 h-48 w-48 rotate-180 text-brand-gold md:h-64 md:w-64" />

      <div className="container relative z-10 mx-auto flex flex-col items-center px-4 py-20 text-center md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <span className="mb-4 inline-block rounded-full border border-primary/20 bg-white/80 px-5 py-1.5 text-sm font-medium text-primary">
            Maquillaje accesible para todas
          </span>

          <h1 className="mb-4 max-w-2xl font-serif text-4xl italic font-bold leading-tight text-foreground md:text-6xl">
            {slogan || "Tu glow empieza aquí"}
          </h1>

          <p className="mb-8 max-w-lg text-lg text-foreground/60">
            {subtitulo ||
              "Descubre nuestro catálogo, participa en dinámicas con premios increíbles y forma parte de la comunidad Makeup Asha."}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/catalogo"
              className={buttonVariants({
                size: "lg",
                className: "rounded-full px-8 text-base",
              })}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Ver catálogo
            </Link>
            <Link
              href="/dinamicas"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className:
                  "rounded-full border-primary/30 px-8 text-base text-primary hover:bg-primary/5",
              })}
            >
              <Gift className="mr-2 h-5 w-5" />
              Dinámicas activas
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
