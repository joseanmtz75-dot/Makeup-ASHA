import { prisma } from "@/lib/prisma";
import { CatalogoGrid } from "@/components/publico/CatalogoGrid";

export const metadata = { title: "Catálogo" };
export const dynamic = "force-dynamic";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const params = await searchParams;

  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      ...(params.categoria && { categoria: params.categoria as never }),
      ...(params.q && {
        nombre: { contains: params.q, mode: "insensitive" },
      }),
    },
    select: {
      id: true,
      nombre: true,
      precio: true,
      stock: true,
      categoria: true,
      destacado: true,
      imagenes: {
        select: { url: true },
        orderBy: { orden: "asc" },
        take: 1,
      },
    },
    orderBy: [{ destacado: "desc" }, { creadoEn: "desc" }],
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Catálogo</h1>
        <p className="text-muted-foreground">
          Maquillaje accesible para todas, entrega en Tonalá, Zapopan,
          Guadalajara y Tlaquepaque.
        </p>
      </div>

      <CatalogoGrid
        productosIniciales={productos}
        categoriaInicial={params.categoria}
        searchInicial={params.q}
      />
    </div>
  );
}
