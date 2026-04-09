import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/getUserContext";
import { ProductoForm } from "@/components/productos/ProductoForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Nuevo producto" };

export default async function NuevoProductoPage() {
  const ctx = await requireRole(["admin"]);
  if (!ctx) redirect("/login?redirect=/dashboard/productos/nuevo");

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/productos"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a productos
        </Link>
        <h1 className="text-3xl font-bold">Nuevo producto</h1>
        <p className="text-sm text-muted-foreground">
          Llena los datos y agrega fotos del producto.
        </p>
      </div>

      <ProductoForm modo="crear" />
    </div>
  );
}
