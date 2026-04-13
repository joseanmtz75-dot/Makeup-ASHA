import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { normalizarTelefonoMx } from "@/lib/whatsapp";

type FooterConfig = {
  nombreNegocio: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  textoLegal: string | null;
  whatsappPrincipal: string | null;
  emailContacto: string | null;
};

export function FooterPublico({ config }: { config: FooterConfig }) {
  const nombre = config.nombreNegocio || "Makeup Asha";
  const hasSocials =
    config.facebookUrl || config.instagramUrl || config.tiktokUrl || config.whatsappPrincipal;

  return (
    <footer className="mt-auto border-t border-primary/10 bg-brand-rosa-claro">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="mb-3 font-serif text-lg italic font-bold text-primary">
              Makeup <span className="text-brand-gold">Asha</span>
            </h3>
            <p className="text-sm text-foreground/60">
              Maquillaje accesible y dinámicas para todas. Servicio en Tonalá,
              Zapopan, Guadalajara y Tlaquepaque.
            </p>

            {/* Social icons */}
            {hasSocials && (
              <div className="mt-4 flex items-center gap-3">
                {config.facebookUrl && (
                  <a
                    href={config.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 text-primary/60 transition hover:bg-primary hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                )}
                {config.instagramUrl && (
                  <a
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 text-primary/60 transition hover:bg-primary hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  </a>
                )}
                {config.tiktokUrl && (
                  <a
                    href={config.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 text-primary/60 transition hover:bg-primary hover:text-white"
                    title="TikTok"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.38-6.22V9.4a8.16 8.16 0 0 0 3.84.96V7.1a4.85 4.85 0 0 1-.01-.4z" />
                    </svg>
                  </a>
                )}
                {config.whatsappPrincipal && (
                  <a
                    href={`https://wa.me/${normalizarTelefonoMx(config.whatsappPrincipal)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-green-300 text-green-600 transition hover:bg-green-600 hover:text-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/40">
              Enlaces
            </h3>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li>
                <Link href="/catalogo" className="transition hover:text-primary">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/dinamicas" className="transition hover:text-primary">
                  Dinámicas activas
                </Link>
              </li>
              <li>
                <Link href="/historial" className="transition hover:text-primary">
                  Ganadoras
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/40">
              Importante
            </h3>
            <p className="text-sm text-foreground/60">
              {config.textoLegal ||
                "Todas las promociones son para mayores de 18 años. Las dinámicas son participaciones promocionales con asignación de número, no constituyen sorteo regulado."}
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-primary/10 pt-6 text-center text-xs text-foreground/40">
          &copy; {new Date().getFullYear()} {nombre}. Todos los derechos
          reservados.
        </div>
      </div>
    </footer>
  );
}
