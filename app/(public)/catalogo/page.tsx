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
      descripcion: true,
      variantes: true,
      imagenes: {
        select: { url: true },
        orderBy: { orden: "asc" },
        take: 5,
      },
    },
    orderBy: [{ destacado: "desc" }, { creadoEn: "desc" }],
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl italic font-bold text-primary">
          Catálogo
        </h1>
        <p className="mt-1 text-foreground/60">
          Maquillaje accesible para todas. Entrega en Tonalá, Zapopan,
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
