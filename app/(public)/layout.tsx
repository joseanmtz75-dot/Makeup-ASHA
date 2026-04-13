import { getConfiguracion } from "@/lib/config";
import { HeaderPublico } from "@/components/layout/HeaderPublico";
import { FooterPublico } from "@/components/layout/FooterPublico";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getConfiguracion();

  return (
    <div className="brand flex min-h-full flex-1 flex-col">
      <HeaderPublico whatsapp={config.whatsappPrincipal} />
      <main className="flex-1">{children}</main>
      <FooterPublico config={config} />
    </div>
  );
}
