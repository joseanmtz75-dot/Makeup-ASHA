"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Producto, ImagenProducto } from "@prisma/client";
import { CATEGORIAS_OPTIONS } from "@/lib/constants/categorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, X, Star } from "lucide-react";

type ProductoConImagenes = Producto & { imagenes: ImagenProducto[] };

type Props = {
  producto?: ProductoConImagenes;
  modo: "crear" | "editar";
};

export function ProductoForm({ producto, modo }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [subiendo, setSubiendo] = useState(false);

  const [nombre, setNombre] = useState(producto?.nombre || "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion || "");
  const [precio, setPrecio] = useState(producto?.precio?.toString() || "");
  const [stock, setStock] = useState(producto?.stock?.toString() || "0");
  const [categoria, setCategoria] = useState(producto?.categoria || "LABIALES");
  const [sku, setSku] = useState(producto?.sku || "");
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [destacado, setDestacado] = useState(producto?.destacado ?? false);
  const [imagenes, setImagenes] = useState<string[]>(
    producto?.imagenes.map((i) => i.url) || []
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imagenes.length + files.length > 10) {
      toast.error("Máximo 10 imágenes por producto");
      return;
    }

    setSubiendo(true);

    try {
      const nuevas: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "productos-publico");

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "X-Requested-With": "XMLHttpRequest" },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(`No se pudo subir ${file.name}`, {
            description: err.error,
          });
          continue;
        }

        const { url } = await res.json();
        nuevas.push(url);
      }
      setImagenes((prev) => [...prev, ...nuevas]);
      if (nuevas.length > 0) toast.success(`${nuevas.length} imagen(es) subida(s)`);
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  }

  function quitarImagen(idx: number) {
    setImagenes((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const precioNum = parseFloat(precio);
    const stockNum = parseInt(stock, 10);

    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (isNaN(precioNum) || precioNum <= 0) {
      toast.error("Precio inválido");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error("Stock inválido");
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      precio: precioNum,
      stock: stockNum,
      categoria,
      sku: sku.trim() || null,
      activo,
      destacado,
      imagenes,
    };

    startTransition(async () => {
      const url =
        modo === "crear"
          ? "/api/admin/productos"
          : `/api/admin/productos/${producto!.id}`;
      const method = modo === "crear" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("No se pudo guardar el producto", {
          description: err.error,
        });
        return;
      }

      toast.success(modo === "crear" ? "Producto creado" : "Producto actualizado");
      router.push("/dashboard/productos");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Labial mate Ruby Rose"
                required
                maxLength={120}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalles del producto..."
                rows={3}
                maxLength={2000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio">Precio (MXN) *</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="99.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría *</Label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as typeof categoria)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                {CATEGORIAS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU (opcional)</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="LAB-001"
                maxLength={50}
              />
            </div>

            <div className="flex items-center gap-4 md:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4"
                />
                Activo (visible en catálogo)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={destacado}
                  onChange={(e) => setDestacado(e.target.checked)}
                  className="h-4 w-4"
                />
                <Star className="h-3.5 w-3.5" /> Destacado en home
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label>Imágenes (máx 10)</Label>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP o GIF. Máx 5MB por imagen.
            </p>
          </div>

          {imagenes.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {imagenes.map((url, idx) => (
                <div
                  key={url}
                  className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
                >
                  <Image
                    src={url}
                    alt={`Imagen ${idx + 1}`}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => quitarImagen(idx)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {imagenes.length < 10 && (
            <div>
              <input
                type="file"
                id="upload"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={subiendo}
                className="hidden"
              />
              <Label
                htmlFor="upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm transition hover:bg-muted"
              >
                {subiendo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {subiendo ? "Subiendo..." : "Agregar imágenes"}
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/productos")}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || subiendo}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {modo === "crear" ? "Crear producto" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
