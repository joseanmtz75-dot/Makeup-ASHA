"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { TIPO_DINAMICA_OPTIONS } from "@/lib/constants/dinamicas";
import type { TipoDinamica } from "@prisma/client";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  imagenes: { url: string }[];
};

type DinamicaExistente = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoDinamica;
  precioBoleto: number;
  totalBoletos: number;
  productoPremioId: string | null;
  premioCustom: string | null;
  imagenPremioUrl: string | null;
  inicioEn: string | null;
  cierreEn: string | null;
};

type Props = {
  modo: "crear" | "editar";
  dinamica?: DinamicaExistente;
  productos: Producto[];
};

export function DinamicaForm({ modo, dinamica, productos }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [nombre, setNombre] = useState(dinamica?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(dinamica?.descripcion ?? "");
  const [tipo, setTipo] = useState<TipoDinamica>(dinamica?.tipo ?? "CLASICA");
  const [precioBoleto, setPrecioBoleto] = useState(
    dinamica?.precioBoleto?.toString() ?? ""
  );
  const [totalBoletos, setTotalBoletos] = useState(
    dinamica?.totalBoletos?.toString() ?? "36"
  );
  const [premioTipo, setPremioTipo] = useState<"catalogo" | "custom">(
    dinamica?.productoPremioId ? "catalogo" : "custom"
  );
  const [productoPremioId, setProductoPremioId] = useState(
    dinamica?.productoPremioId ?? ""
  );
  const [premioCustom, setPremioCustom] = useState(
    dinamica?.premioCustom ?? ""
  );
  const [imagenPremioUrl, setImagenPremioUrl] = useState(
    dinamica?.imagenPremioUrl ?? ""
  );
  const [inicioEn, setInicioEn] = useState(
    dinamica?.inicioEn ? dinamica.inicioEn.slice(0, 16) : ""
  );
  const [cierreEn, setCierreEn] = useState(
    dinamica?.cierreEn ? dinamica.cierreEn.slice(0, 16) : ""
  );
  const [subiendo, setSubiendo] = useState(false);

  async function handleUploadImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    try {
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
        toast.error(err.error || "Error al subir imagen");
        return;
      }

      const { url } = await res.json();
      setImagenPremioUrl(url);
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!precioBoleto || parseFloat(precioBoleto) <= 0) {
      toast.error("El precio del boleto es obligatorio");
      return;
    }
    if (premioTipo === "catalogo" && !productoPremioId) {
      toast.error("Elige un producto como premio");
      return;
    }
    if (premioTipo === "custom" && !premioCustom.trim()) {
      toast.error("Escribe la descripción del premio");
      return;
    }

    const payload = {
      nombre,
      descripcion: descripcion || null,
      tipo,
      precioBoleto: parseFloat(precioBoleto),
      totalBoletos: parseInt(totalBoletos),
      productoPremioId: premioTipo === "catalogo" ? productoPremioId : null,
      premioCustom: premioTipo === "custom" ? premioCustom : null,
      imagenPremioUrl: imagenPremioUrl || null,
      inicioEn: inicioEn ? new Date(inicioEn).toISOString() : null,
      cierreEn: cierreEn ? new Date(cierreEn).toISOString() : null,
    };

    startTransition(async () => {
      const url =
        modo === "crear"
          ? "/api/admin/dinamicas"
          : `/api/admin/dinamicas/${dinamica!.id}`;
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
        toast.error("No se pudo guardar", { description: err.error });
        return;
      }

      toast.success(
        modo === "crear" ? "Dinámica creada" : "Dinámica actualizada"
      );
      router.push("/dashboard/dinamicas");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la dinámica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Dinámica de Labiales Premium"
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
                placeholder="Descripción opcional de la dinámica..."
                rows={3}
                maxLength={2000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={tipo}
                onValueChange={(v) => v && setTipo(v as TipoDinamica)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_DINAMICA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precioBoleto">Precio por boleto (MXN) *</Label>
              <Input
                id="precioBoleto"
                type="number"
                step="0.01"
                min="1"
                value={precioBoleto}
                onChange={(e) => setPrecioBoleto(e.target.value)}
                placeholder="35"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalBoletos">Total de boletos *</Label>
              <Input
                id="totalBoletos"
                type="number"
                min="2"
                max="1000"
                value={totalBoletos}
                onChange={(e) => setTotalBoletos(e.target.value)}
                placeholder="36"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premio */}
      <Card>
        <CardHeader>
          <CardTitle>Premio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              type="button"
              variant={premioTipo === "catalogo" ? "default" : "outline"}
              onClick={() => setPremioTipo("catalogo")}
            >
              Del catálogo
            </Button>
            <Button
              type="button"
              variant={premioTipo === "custom" ? "default" : "outline"}
              onClick={() => setPremioTipo("custom")}
            >
              Premio personalizado
            </Button>
          </div>

          {premioTipo === "catalogo" ? (
            <div className="space-y-2">
              <Label>Producto premio *</Label>
              <Select
                value={productoPremioId}
                onValueChange={(v) => setProductoPremioId(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige un producto..." />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} — ${p.precio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="premioCustom">Descripción del premio *</Label>
                <Input
                  id="premioCustom"
                  value={premioCustom}
                  onChange={(e) => setPremioCustom(e.target.value)}
                  placeholder="Ej: Kit de maquillaje completo"
                  maxLength={300}
                />
              </div>

              <div className="space-y-2">
                <Label>Imagen del premio</Label>
                {imagenPremioUrl ? (
                  <div className="relative inline-block">
                    <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                      <Image
                        src={imagenPremioUrl}
                        alt="Premio"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setImagenPremioUrl("")}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="upload-premio"
                      accept="image/*"
                      onChange={handleUploadImagen}
                      disabled={subiendo}
                      className="hidden"
                    />
                    <Label
                      htmlFor="upload-premio"
                      className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      {subiendo ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6" />
                          Subir imagen
                        </>
                      )}
                    </Label>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fechas */}
      <Card>
        <CardHeader>
          <CardTitle>Fechas (opcional)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inicioEn">Inicio programado</Label>
            <Input
              id="inicioEn"
              type="datetime-local"
              value={inicioEn}
              onChange={(e) => setInicioEn(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cierreEn">Cierre (para express/flash)</Label>
            <Input
              id="cierreEn"
              type="datetime-local"
              value={cierreEn}
              onChange={(e) => setCierreEn(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/dinamicas")}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || subiendo}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {modo === "crear" ? "Crear dinámica" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
