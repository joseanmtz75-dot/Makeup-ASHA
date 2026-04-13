"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, MessageCircle, LogIn } from "lucide-react";
import { normalizarTelefonoMx } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/dinamicas", label: "Dinámicas" },
  { href: "/historial", label: "Ganadoras" },
];

export function HeaderPublico({ whatsapp }: { whatsapp?: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const whatsappHref = whatsapp
    ? `https://wa.me/${normalizarTelefonoMx(whatsapp)}`
    : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-primary/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span className="font-serif text-xl italic font-bold text-primary">
            Makeup{" "}
            <span className="text-brand-gold">Asha</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition hover:text-primary",
                pathname === link.href
                  ? "text-primary font-semibold"
                  : "text-foreground/70"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="hidden items-center gap-2 md:flex">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              title="WhatsApp"
            >
              <MessageCircle className="h-5 w-5 text-green-600" />
            </a>
          )}
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <MessageCircle className="h-5 w-5 text-green-600" />
            </a>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <SheetTitle className="flex h-16 items-center gap-1 border-b px-6">
                <span className="font-serif text-lg italic font-bold text-primary">
                  Makeup <span className="text-brand-gold">Asha</span>
                </span>
              </SheetTitle>
              <nav className="flex flex-col p-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm font-medium transition",
                      pathname === link.href
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-muted"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-4 border-t pt-4">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-full"
                    )}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
