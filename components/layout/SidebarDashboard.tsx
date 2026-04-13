"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
  Menu,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/dinamicas", label: "Dinámicas", icon: Ticket },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/clientas", label: "Clientas", icon: Users },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/dashboard/comprobantes", label: "Comprobantes", icon: Receipt },
  { href: "/dashboard/cancelaciones", label: "Cancelaciones", icon: Ban },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings, adminOnly: true },
];

type Props = {
  role?: "admin" | "operadora";
};

function NavLinks({ role, onNavigate }: { role?: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <nav className="flex-1 space-y-1 p-4">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  );
}

function FooterLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-1 border-t border-border/40 p-4">
      <Link
        href="/"
        onClick={onNavigate}
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
  );
}

export function SidebarDashboard({ role }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-60 flex-col border-r border-border/40 bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border/40 px-6 font-bold">
          <Sparkles className="h-5 w-5 text-primary" />
          ASHA Admin
        </div>
        <NavLinks role={role} />
        <FooterLinks />
      </aside>

      {/* Mobile header + sheet */}
      <div className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="flex h-16 items-center gap-2 border-b border-border/40 px-6 font-bold">
              <Sparkles className="h-5 w-5 text-primary" />
              ASHA Admin
            </SheetTitle>
            <NavLinks role={role} onNavigate={() => setOpen(false)} />
            <FooterLinks onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-bold">ASHA Admin</span>
      </div>
    </>
  );
}
