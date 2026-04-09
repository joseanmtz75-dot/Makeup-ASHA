import Link from "next/link";
import { Sparkles } from "lucide-react";

export function HeaderPublico() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>ASHA</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/" className="transition hover:text-primary">
            Inicio
          </Link>
          <Link href="/catalogo" className="transition hover:text-primary">
            Catálogo
          </Link>
          <Link href="/dinamicas" className="transition hover:text-primary">
            Dinámicas
          </Link>
          <Link href="/historial" className="transition hover:text-primary">
            Ganadoras
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/mi-perfil"
            className="text-sm font-medium transition hover:text-primary"
          >
            Mi perfil
          </Link>
        </div>
      </div>
    </header>
  );
}
