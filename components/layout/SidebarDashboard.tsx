"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Receipt,
  Settings,
  Sparkles,
  LogOut,
  Ticket,
  Ban,
  ExternalLink,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/dinamicas", label: "Dinámicas", icon: Ticket },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/clientas", label: "Clientas", icon: Users },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/dashboard/comprobantes", label: "Comprobantes", icon: Receipt },
  { href: "/dashboard/cancelaciones", label: "Cancelaciones", icon: Ban },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

export function SidebarDashboard() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-60 flex-col border-r border-border/40 bg-card md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border/40 px-6 font-bold">
        <Sparkles className="h-5 w-5 text-primary" />
        ASHA Admin
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border/40 p-4">
        <Link
          href="/"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          Ver página
        </Link>
        <form action="/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
