import { HeaderPublico } from "@/components/layout/HeaderPublico";
import { FooterPublico } from "@/components/layout/FooterPublico";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HeaderPublico />
      <main className="flex-1">{children}</main>
      <FooterPublico />
    </>
  );
}
