import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/getUserContext";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MUNICIPIOS_LABEL } from "@/lib/constants/municipios";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { ArrowLeft, Pencil, Phone, Mail, MapPin, ShoppingBag, Award } from "lucide-react";

export const metadata = { title: "Detalle de clienta" };

function formatTelefono(tel: string) {
  if (tel.length !== 10) return tel;
  return `${tel.slice(0, 2)} ${tel.slice(2, 6)} ${tel.slice(6)}`;
}

export default async function DetalleClientaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard/clientas");

  const { id } = await params;
  const clienta = await prisma.clienta.findUnique({
    where: { id },
    include: {
      compras: {
        include: { producto: true },
        orderBy: { creadaEn: "desc" },
      },
      _count: { select: { compras: true, referidas: true } },
    },
  });

  if (!clienta) notFound();

  const totalGastado = clienta.compras
    .filter((c) => c.estatus !== "CANCELADO")
    .reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/clientas"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a clientas
          </Link>
          <h1 className="text-3xl font-bold">{clienta.nombre}</h1>
          <Badge className="mt-2">{clienta.nivelActual}</Badge>
        </div>

        <Link
          href={`/dashboard/clientas/${id}/editar`}
          className={buttonVariants({ variant: "outline" })}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <ShoppingBag className="h-5 w-5 text-primary" />
              {clienta._count.compras}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total gastado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatearMxn(totalGastado)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Puntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Award className="h-5 w-5 text-primary" />
              {clienta.puntos}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información de contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a
              href={`tel:+52${clienta.telefono}`}
              className="hover:text-primary"
            >
              {formatTelefono(clienta.telefono)}
            </a>
          </div>

          {clienta.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${clienta.email}`} className="hover:text-primary">
                {clienta.email}
              </a>
            </div>
          )}

          {(clienta.direccion || clienta.municipio) && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                {clienta.direccion && <div>{clienta.direccion}</div>}
                {clienta.municipio && (
                  <div className="text-muted-foreground">
                    {MUNICIPIOS_LABEL[clienta.municipio]}
                  </div>
                )}
                {clienta.referenciaDir && (
                  <div className="mt-1 text-xs italic text-muted-foreground">
                    Ref: {clienta.referenciaDir}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {clienta.notas && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notas internas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {clienta.notas}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historial de compras</CardTitle>
        </CardHeader>
        <CardContent>
          {clienta.compras.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Esta clienta aún no ha hecho compras.
            </p>
          ) : (
            <div className="space-y-2">
              {clienta.compras.map((compra) => (
                <div
                  key={compra.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div>
                    <div className="font-medium">{compra.producto.nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      {compra.cantidad} x {formatearMxn(compra.precioUnitario)} ·{" "}
                      {new Date(compra.creadaEn).toLocaleDateString("es-MX")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatearMxn(compra.total)}</div>
                    <Badge variant="outline" className="text-xs">
                      {compra.estatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
