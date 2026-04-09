import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/getUserContext";
import { getConfiguracion } from "@/lib/config";
import { Settings } from "lucide-react";
import { ConfiguracionForm } from "@/components/dashboard/ConfiguracionForm";

export const metadata = { title: "Configuración del sitio" };
export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  // Solo admin (operadora no entra)
  const ctx = await requireRole(["admin"]);
  if (!ctx) redirect("/dashboard");

  const config = await getConfiguracion();

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Settings className="h-8 w-8 text-primary" />
          Configuración del sitio
        </h1>
        <p className="text-sm text-muted-foreground">
          Marca, colores y datos de contacto. Los cambios se reflejan
          inmediatamente en la página pública.
        </p>
      </div>

      <ConfiguracionForm config={config} />
    </div>
  );
}
