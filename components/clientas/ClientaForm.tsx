"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clienta } from "@prisma/client";
import { MUNICIPIOS_OPTIONS } from "@/lib/constants/municipios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = {
  clienta?: Clienta;
  modo: "crear" | "editar";
};

export function ClientaForm({ clienta, modo }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [telefono, setTelefono] = useState(clienta?.telefono || "");
  const [nombre, setNombre] = useState(clienta?.nombre || "");
  const [email, setEmail] = useState(clienta?.email || "");
  const [direccion, setDireccion] = useState(clienta?.direccion || "");
  const [municipio, setMunicipio] = useState(clienta?.municipio || "");
  const [referenciaDir, setReferenciaDir] = useState(
    clienta?.referenciaDir || ""
  );
  const [notas, setNotas] = useState(clienta?.notas || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const telLimpio = telefono.replace(/\D/g, "");
    if (telLimpio.length !== 10) {
      toast.error("El teléfono debe tener 10 dígitos");
      return;
    }

    const payload = {
      telefono: telLimpio,
      nombre: nombre.trim(),
      email: email.trim() || null,
      direccion: direccion.trim() || null,
      municipio: municipio || null,
      referenciaDir: referenciaDir.trim() || null,
      notas: notas.trim() || null,
    };

    startTransition(async () => {
      const url =
        modo === "crear"
          ? "/api/admin/clientas"
          : `/api/admin/clientas/${clienta!.id}`;
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
        toast.error("No se pudo guardar la clienta", {
          description: err.error,
        });
        return;
      }

      toast.success(modo === "crear" ? "Clienta creada" : "Clienta actualizada");
      router.push("/dashboard/clientas");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Karla González"
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono (10 dígitos) *</Label>
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="3312345678"
                required
                disabled={modo === "editar"}
              />
              {modo === "editar" && (
                <p className="text-xs text-muted-foreground">
                  El teléfono no se puede cambiar
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="karla@correo.com"
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipio">Municipio</Label>
              <select
                id="municipio"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value as typeof municipio)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecciona...</option>
                {MUNICIPIOS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número, colonia"
                maxLength={300}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="referenciaDir">Referencia de la dirección</Label>
              <Input
                id="referenciaDir"
                value={referenciaDir}
                onChange={(e) => setReferenciaDir(e.target.value)}
                placeholder="Casa azul frente al parque..."
                maxLength={300}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notas">Notas internas</Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Información que solo ustedes ven..."
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/clientas")}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {modo === "crear" ? "Crear clienta" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
