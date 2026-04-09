import Link from "next/link";

export function FooterPublico() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-base font-semibold">ASHA</h3>
            <p className="text-sm text-muted-foreground">
              Maquillaje accesible y promociones para todas. Servicio en
              Tonalá, Zapopan, Guadalajara y Tlaquepaque.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-base font-semibold">Enlaces</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/catalogo" className="transition hover:text-primary">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link
                  href="/dinamicas"
                  className="transition hover:text-primary"
                >
                  Dinámicas activas
                </Link>
              </li>
              <li>
                <Link
                  href="/historial"
                  className="transition hover:text-primary"
                >
                  Ganadoras anteriores
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-base font-semibold">Importante</h3>
            <p className="text-sm text-muted-foreground">
              Todas las promociones son para mayores de 18 años. Las dinámicas
              son participaciones promocionales con asignación de número, no
              constituyen sorteo regulado.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ASHA. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
