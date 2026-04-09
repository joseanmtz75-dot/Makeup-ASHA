import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

// Rutas que requieren rol admin u operadora
const RUTAS_DASHBOARD = ["/dashboard"];

// Rutas solo para admin (no operadora)
const RUTAS_SOLO_ADMIN = ["/dashboard/configuracion"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Aplicar headers de seguridad a todas las respuestas
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  const pathname = request.nextUrl.pathname;
  const esRutaDashboard = RUTAS_DASHBOARD.some((r) => pathname.startsWith(r));

  if (!esRutaDashboard) {
    return response;
  }

  // Verificar sesión solo para rutas del dashboard
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión → redirigir a login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const role = (user.user_metadata?.role as string) || "clienta";

  // Solo admin/operadora pueden entrar al dashboard
  if (role !== "admin" && role !== "operadora") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Algunas rutas son solo para admin
  const esRutaSoloAdmin = RUTAS_SOLO_ADMIN.some((r) => pathname.startsWith(r));
  if (esRutaSoloAdmin && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, sitemap.xml, robots.txt
     * - cualquier archivo con extensión (imagen, css, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
