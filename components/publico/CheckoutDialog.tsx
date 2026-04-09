"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { MUNICIPIOS_OPTIONS } from "@/lib/constants/municipios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Upload, CheckCircle2, X } from "lucide-react";

type Props = {
  producto: {
    id: string;
    nombre: string;
    precio: number;
    stock: number;
  };
  trigger?: React.ReactElement;
};

type Step = "datos" | "pago" | "confirmacion";

export function CheckoutDialog({ producto, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("datos");
  const [isPending, startTransition] = useTransition();
  const [subiendo, setSubiendo] = useState(false);

  // Datos clienta
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [referenciaDir, setReferenciaDir] = useState("");

  // Compra
  const [cantidad, setCantidad] = useState(1);
  const [notasCliente, setNotasCliente] = useState("");

  // Pago
  const [metodoPago, setMetodoPago] = useState<
    "TRANSFERENCIA" | "EFECTIVO" | "OXXO"
  >("TRANSFERENCIA");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [comprobantePath, setComprobantePath] = useState<string | null>(null);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);

  const total = producto.precio * cantidad;

  function reset() {
    setStep("datos");
    setNombre("");
    setTelefono("");
    setDireccion("");
    setMunicipio("");
    setReferenciaDir("");
    setCantidad(1);
    setNotasCliente("");
    setMetodoPago("TRANSFERENCIA");
    setReferenciaPago("");
    setComprobantePath(null);
    setComprobanteFile(null);
  }

  function siguientePaso() {
    if (step === "datos") {
      if (!nombre.trim() || nombre.trim().length < 2) {
        toast.error("Escribe tu nombre");
        return;
      }
      const tel = telefono.replace(/\D/g, "");
      if (tel.length !== 10) {
        toast.error("Tu teléfono debe tener 10 dígitos");
        return;
      }
      if (!direccion.trim() || direccion.trim().length < 5) {
        toast.error("Escribe tu dirección completa");
        return;
      }
      if (!municipio) {
        toast.error("Selecciona tu municipio");
        return;
      }
      setStep("pago");
    }
  }

  async function subirComprobante(file: File) {
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/comprobantes/upload", {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("No se pudo subir el comprobante", {
          description: err.error,
        });
        return;
      }

      const { path } = await res.json();
      setComprobantePath(path);
      setComprobanteFile(file);
      toast.success("Comprobante subido");
    } finally {
      setSubiendo(false);
    }
  }

  function confirmarCompra() {
    if (!comprobantePath) {
      toast.error("Sube tu comprobante de pago");
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      telefono: telefono.replace(/\D/g, ""),
      direccion: direccion.trim(),
      municipio,
      referenciaDir: referenciaDir.trim() || null,
      productoId: producto.id,
      cantidad,
      metodoPago,
      comprobantePath,
      referenciaPago: referenciaPago.trim() || null,
      notasCliente: notasCliente.trim() || null,
    };

    startTransition(async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("No se pudo procesar el pedido", {
          description: err.error,
        });
        return;
      }

      setStep("confirmacion");
    });
  }

  function cerrarYResetear() {
    setOpen(false);
    setTimeout(() => {
      reset();
      router.refresh();
    }, 300);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(reset, 300);
      }}
    >
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        {step === "datos" && (
          <>
            <DialogHeader>
              <DialogTitle>Tus datos</DialogTitle>
              <DialogDescription>
                Para que podamos entregarte tu pedido.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ck-nombre">Nombre completo *</Label>
                <Input
                  id="ck-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Karla González"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ck-tel">WhatsApp (10 dígitos) *</Label>
                <Input
                  id="ck-tel"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="3312345678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ck-municipio">Municipio *</Label>
                <select
                  id="ck-municipio"
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecciona...</option>
                  {MUNICIPIOS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ck-direccion">Dirección *</Label>
                <Input
                  id="ck-direccion"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, número, colonia"
                  maxLength={300}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ck-ref">Referencia (opcional)</Label>
                <Input
                  id="ck-ref"
                  value={referenciaDir}
                  onChange={(e) => setReferenciaDir(e.target.value)}
                  placeholder="Casa azul, frente al parque..."
                  maxLength={300}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ck-cant">Cantidad</Label>
                <Input
                  id="ck-cant"
                  type="number"
                  min={1}
                  max={Math.min(20, producto.stock)}
                  value={cantidad}
                  onChange={(e) =>
                    setCantidad(Math.max(1, parseInt(e.target.value) || 1))
                  }
                />
              </div>

              <div className="rounded-md border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>{producto.nombre}</span>
                  <span>
                    {cantidad} × {formatearMxn(producto.precio)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatearMxn(total)}</span>
                </div>
              </div>

              <Button onClick={siguientePaso} className="w-full" size="lg">
                Continuar al pago
              </Button>
            </div>
          </>
        )}

        {step === "pago" && (
          <>
            <DialogHeader>
              <DialogTitle>Pago y comprobante</DialogTitle>
              <DialogDescription>
                Total a pagar:{" "}
                <strong className="text-primary">
                  {formatearMxn(total)}
                </strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Método de pago *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["TRANSFERENCIA", "Transferencia"],
                      ["EFECTIVO", "Efectivo"],
                      ["OXXO", "OXXO"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMetodoPago(val)}
                      className={`rounded-md border px-3 py-2 text-sm transition ${
                        metodoPago === val
                          ? "border-primary bg-primary/10 font-medium text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <strong>Datos para transferencia:</strong>
                <br />
                Te los pasamos por WhatsApp en cuanto confirmes este pedido. O
                contáctanos antes de pagar.
              </div>

              <div className="space-y-2">
                <Label htmlFor="ck-ref-pago">Referencia (opcional)</Label>
                <Input
                  id="ck-ref-pago"
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  placeholder="Últimos 4 dígitos, folio..."
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Comprobante de pago *</Label>
                {comprobanteFile ? (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="flex-1 truncate">
                      {comprobanteFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setComprobantePath(null);
                        setComprobanteFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="ck-comp"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) subirComprobante(f);
                      }}
                      disabled={subiendo}
                      className="hidden"
                    />
                    <Label
                      htmlFor="ck-comp"
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-6 text-sm transition hover:bg-muted"
                    >
                      {subiendo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {subiendo ? "Subiendo..." : "Subir captura del pago"}
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      JPG, PNG o WebP. Máx 5MB.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ck-notas">Notas adicionales (opcional)</Label>
                <Textarea
                  id="ck-notas"
                  value={notasCliente}
                  onChange={(e) => setNotasCliente(e.target.value)}
                  placeholder="Cualquier cosa que quieras decirnos..."
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("datos")}
                  disabled={isPending}
                >
                  Atrás
                </Button>
                <Button
                  onClick={confirmarCompra}
                  disabled={isPending || subiendo || !comprobantePath}
                  className="flex-1"
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirmar pedido
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "confirmacion" && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <DialogTitle className="text-center">¡Pedido recibido!</DialogTitle>
              <DialogDescription className="text-center">
                Tu compra quedó registrada. Las administradoras revisarán tu
                comprobante y se comunicarán contigo por WhatsApp para
                confirmar la entrega.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-md border bg-muted/30 p-4 text-sm">
              <div className="mb-2 font-semibold">Resumen de tu pedido:</div>
              <div>
                {cantidad} × {producto.nombre}
              </div>
              <div className="mt-1 text-base font-bold text-primary">
                Total: {formatearMxn(total)}
              </div>
            </div>

            <Button onClick={cerrarYResetear} className="w-full">
              Listo
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
