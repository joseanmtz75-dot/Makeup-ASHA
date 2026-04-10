import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import {
  Package,
  Users,
  ShoppingCart,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Ticket,
  Ban,
} from "lucide-react";

export const metadata = { title: "Inicio" };
export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard");

  // Métricas en paralelo
  const [
    totalProductos,
    productosActivos,
    productosBajoStock,
    totalClientas,
    pedidosPendientes,
    pedidosPagados,
    pedidosListos,
    comprobantesPendientes,
    dinamicasActivas,
    cancelacionesPendientes,
    ventasMes,
  ] = await Promise.all([
    prisma.producto.count(),
    prisma.producto.count({ where: { activo: true } }),
    prisma.producto.findMany({
      where: { activo: true, stock: { lt: 5 } },
      select: { id: true, nombre: true, stock: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.clienta.count(),
    prisma.compra.count({ where: { estatus: "PENDIENTE" } }),
    prisma.compra.count({ where: { estatus: "PAGADO" } }),
    prisma.compra.count({ where: { estatus: "LISTO_ENTREGA" } }),
    prisma.comprobante.count({ where: { estatus: "PENDIENTE" } }),
    prisma.dinamica.count({ where: { estatus: { in: ["ACTIVA", "LLENA"] } } }),
    prisma.solicitudCancelacion.count({ where: { estatus: "PENDIENTE" } }),
    prisma.compra.aggregate({
      where: {
        estatus: { notIn: ["CANCELADO", "PENDIENTE"] },
        creadaEn: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { total: true },
    }),
  ]);

  const totalVendidoMes = ventasMes._sum.total ?? 0;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Hola 👋</h1>
        <p className="text-muted-foreground">
          Resumen de tu negocio en este momento.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vendido este mes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatearMxn(totalVendidoMes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Solo pedidos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productosActivos}</div>
            <p className="text-xs text-muted-foreground">
              {totalProductos} total ({productosActivos} activos)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientas}</div>
            <p className="text-xs text-muted-foreground">registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dinámicas</CardTitle>
            <Ticket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dinamicasActivas}</div>
            <p className="text-xs text-muted-foreground">activas ahora</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* Acciones requeridas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones requeridas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {comprobantesPendientes > 0 && (
              <Link
                href="/dashboard/comprobantes"
                className="flex items-center justify-between rounded-md border bg-amber-50 p-3 transition hover:bg-amber-100"
              >
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-amber-700" />
                  <div>
                    <div className="text-sm font-medium">
                      {comprobantesPendientes} comprobante(s) por validar
                    </div>
                    <div className="text-xs text-amber-900/70">
                      Revisa y aprueba pagos
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-700" />
              </Link>
            )}

            {pedidosPagados > 0 && (
              <Link
                href="/dashboard/pedidos?estatus=PAGADO"
                className="flex items-center justify-between rounded-md border bg-blue-50 p-3 transition hover:bg-blue-100"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-blue-700" />
                  <div>
                    <div className="text-sm font-medium">
                      {pedidosPagados} pedido(s) por preparar
                    </div>
                    <div className="text-xs text-blue-900/70">
                      Pagados, listos para alistar
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-blue-700" />
              </Link>
            )}

            {pedidosListos > 0 && (
              <Link
                href="/dashboard/pedidos?estatus=LISTO_ENTREGA"
                className="flex items-center justify-between rounded-md border bg-purple-50 p-3 transition hover:bg-purple-100"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-purple-700" />
                  <div>
                    <div className="text-sm font-medium">
                      {pedidosListos} pedido(s) listo(s) para entregar
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-purple-700" />
              </Link>
            )}

            {pedidosPendientes > 0 && (
              <Link
                href="/dashboard/pedidos?estatus=PENDIENTE"
                className="flex items-center justify-between rounded-md border p-3 transition hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      {pedidosPendientes} pedido(s) sin validar
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            )}

            {cancelacionesPendientes > 0 && (
              <Link
                href="/dashboard/cancelaciones"
                className="flex items-center justify-between rounded-md border bg-red-50 p-3 transition hover:bg-red-100"
              >
                <div className="flex items-center gap-3">
                  <Ban className="h-5 w-5 text-red-700" />
                  <div>
                    <div className="text-sm font-medium">
                      {cancelacionesPendientes} cancelación(es) por revisar
                    </div>
                    <div className="text-xs text-red-900/70">
                      Solicitudes de clientas
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-red-700" />
              </Link>
            )}

            {comprobantesPendientes === 0 &&
              pedidosPagados === 0 &&
              pedidosListos === 0 &&
              pedidosPendientes === 0 &&
              cancelacionesPendientes === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Todo al día 🎉
                </p>
              )}
          </CardContent>
        </Card>

        {/* Stock bajo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Productos con stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productosBajoStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Todos los productos tienen buen stock
              </p>
            ) : (
              <div className="space-y-2">
                {productosBajoStock.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/productos/${p.id}`}
                    className="flex items-center justify-between rounded-md p-2 text-sm transition hover:bg-muted"
                  >
                    <span>{p.nombre}</span>
                    <Badge
                      variant={p.stock === 0 ? "destructive" : "secondary"}
                    >
                      {p.stock === 0 ? "Agotado" : `Quedan ${p.stock}`}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
