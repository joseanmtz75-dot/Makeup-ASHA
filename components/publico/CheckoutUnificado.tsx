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
import {
  Loader2,
  Upload,
  CheckCircle2,
  X,
  Ticket,
} from "lucide-react";

// --- Tipos ---

type ProductoConfig = {
  tipo: "producto";
  producto: { id: string; nombre: string; precio: number; stock: number };
  trigger: React.ReactElement;
};

type BoletoConfig = {
  tipo: "boleto";
  dinamicaId: string;
  dinamicaNombre: string;
  numeros: number[];
  precioBoleto: number;
  open: boolean;
  onClose: () => void;
};

type Props = ProductoConfig | BoletoConfig;

type Step = "datos" | "pago" | "confirmacion";

// --- Componente ---

export function CheckoutUnificado(props: Props) {
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

  // Producto-only
  const [cantidad, setCantidad] = useState(1);
  const [notasCliente, setNotasCliente] = useState("");

  // Pago
  const [metodoPago, setMetodoPago] = useState<
    "TRANSFERENCIA" | "EFECTIVO" | "OXXO"
  >("TRANSFERENCIA");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [comprobantePath, setComprobantePath] = useState<string | null>(null);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);

  const esBoleto = props.tipo === "boleto";
  const total = esBoleto
    ? props.numeros.length * props.precioBoleto
    : props.producto.precio * cantidad;

  const isOpen = esBoleto ? props.open : open;
  const titulo = esBoleto
    ? `Participar en ${props.dinamicaNombre}`
    : "Tus datos";

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

  function handleOpenChange(value: boolean) {
    if (esBoleto) {
      if (!value) handleClose();
    } else {
      setOpen(value);
      if (!value) setTimeout(reset, 300);
    }
  }

  function handleClose() {
    if (esBoleto) props.onClose();
    else setOpen(false);
    setTimeout(() => {
      reset();
      router.refresh();
    }, 300);
  }

  function siguientePaso() {
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
      toast.error("Escribe tu dirección para la entrega");
      return;
    }
    if (!municipio) {
      toast.error("Selecciona tu municipio");
      return;
    }
    setStep("pago");
  }

  async function subirComprobante(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen es muy grande (máximo 5MB)");
      return;
    }
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

  function confirmar() {
    if (!comprobantePath) {
      toast.error("Sube tu comprobante de pago");
      return;
    }

    startTransition(async () => {
      let url: string;
      let payload: Record<string, unknown>;

      if (esBoleto) {
        url = "/api/boletos/reservar";
        payload = {
          dinamicaId: props.dinamicaId,
          numeros: props.numeros,
          nombre: nombre.trim(),
          telefono: telefono.replace(/\D/g, ""),
          direccion: direccion.trim(),
          municipio,
          metodoPago,
          comprobantePath,
          referenciaPago: referenciaPago.trim() || null,
        };
      } else {
        url = "/api/checkout";
        payload = {
          nombre: nombre.trim(),
          telefono: telefono.replace(/\D/g, ""),
          direccion: direccion.trim(),
          municipio,
          referenciaDir: referenciaDir.trim() || null,
          productoId: props.producto.id,
          cantidad,
          metodoPago,
          comprobantePath,
          referenciaPago: referenciaPago.trim() || null,
          notasCliente: notasCliente.trim() || null,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(
          esBoleto ? "No se pudo reservar" : "No se pudo procesar el pedido",
          { description: err.error }
        );
        return;
      }

      setStep("confirmacion");
    });
  }

  const dialogContent = (
    <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
      {/* --- PASO 1: DATOS --- */}
      {step === "datos" && (
        <>
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            <DialogDescription>
              {esBoleto
                ? "Completa tus datos para participar."
                : "Para que podamos entregarte tu pedido."}
            </DialogDescription>
          </DialogHeader>

          {/* Resumen de boletos */}
          {esBoleto && (
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Ticket className="h-4 w-4 text-primary" />
                <span>
                  {props.numeros.length}{" "}
                  {props.numeros.length === 1 ? "boleto" : "boletos"}:{" "}
                  <strong>
                    #{props.numeros.sort((a, b) => a - b).join(", #")}
                  </strong>
                </span>
              </div>
              <div className="mt-1 text-right text-lg font-bold text-primary">
                Total: {formatearMxn(total)}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ck-nombre">Nombre completo *</Label>
              <Input
                id="ck-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre completo"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ck-tel">WhatsApp (10 dígitos) *</Label>
              <Input
                id="ck-tel"
                type="tel"
                inputMode="numeric"
                value={telefono}
                onChange={(e) => {
                  const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setTelefono(soloDigitos);
                }}
                placeholder="3312345678"
                maxLength={10}
              />
              {telefono.length > 0 && telefono.length < 10 && (
                <p className="text-xs text-muted-foreground">
                  {telefono.length}/10 dígitos
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ck-direccion">Dirección de entrega *</Label>
              <Input
                id="ck-direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número, colonia..."
                maxLength={300}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ck-municipio">Municipio *</Label>
              <select
                id="ck-municipio"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecciona...</option>
                {MUNICIPIOS_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Campos extra para productos */}
            {!esBoleto && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ck-ref-dir">Referencia (opcional)</Label>
                  <Input
                    id="ck-ref-dir"
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
                    max={Math.min(20, props.producto.stock)}
                    value={cantidad}
                    onChange={(e) =>
                      setCantidad(Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>{props.producto.nombre}</span>
                    <span>
                      {cantidad} x {formatearMxn(props.producto.precio)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatearMxn(total)}</span>
                  </div>
                </div>
              </>
            )}

            <Button onClick={siguientePaso} className="w-full" size="lg">
              Siguiente: Pago
            </Button>
          </div>
        </>
      )}

      {/* --- PASO 2: PAGO --- */}
      {step === "pago" && (
        <>
          <DialogHeader>
            <DialogTitle>Pago y comprobante</DialogTitle>
            <DialogDescription>
              Total a pagar:{" "}
              <strong className="text-primary">{formatearMxn(total)}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Método de pago *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "TRANSFERENCIA", label: "Transferencia" },
                    { value: "EFECTIVO", label: "Efectivo" },
                    { value: "OXXO", label: "OXXO" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMetodoPago(m.value)}
                    className={`rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                      metodoPago === m.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {metodoPago === "TRANSFERENCIA" && (
              <>
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <strong>Datos para transferencia:</strong>
                  <br />
                  Te los pasamos por WhatsApp en cuanto confirmes. O contáctanos
                  antes de pagar.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ck-ref-pago">
                    Referencia de pago (últimos 4 dígitos)
                  </Label>
                  <Input
                    id="ck-ref-pago"
                    value={referenciaPago}
                    onChange={(e) => setReferenciaPago(e.target.value)}
                    placeholder="Opcional"
                    maxLength={100}
                  />
                </div>
              </>
            )}

            {/* Comprobante */}
            <div className="space-y-2">
              <Label>Comprobante de pago *</Label>
              {comprobantePath && comprobanteFile ? (
                <div className="flex items-center justify-between rounded-lg border bg-green-50 p-3">
                  <span className="text-sm text-green-800">
                    {comprobanteFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setComprobantePath(null);
                      setComprobanteFile(null);
                    }}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="ck-comprobante"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) subirComprobante(f);
                      e.target.value = "";
                    }}
                    disabled={subiendo}
                    className="hidden"
                  />
                  <Label
                    htmlFor="ck-comprobante"
                    className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-sm text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    {subiendo ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        Sube foto del comprobante
                      </>
                    )}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG o WebP. Máx 5MB.
                  </p>
                </div>
              )}
            </div>

            {/* Notas (solo productos) */}
            {!esBoleto && (
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
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("datos")}
                disabled={isPending}
                className="flex-1"
              >
                Atrás
              </Button>
              <Button
                onClick={confirmar}
                disabled={isPending || subiendo || !comprobantePath}
                className="flex-1"
              >
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar
              </Button>
            </div>
          </div>
        </>
      )}

      {/* --- PASO 3: CONFIRMACIÓN --- */}
      {step === "confirmacion" && (
        <div className="space-y-4 py-4 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h3 className="text-xl font-bold">
            {esBoleto
              ? "Tus números están registrados"
              : "¡Pedido recibido!"}
          </h3>
          <p className="text-muted-foreground">
            Las administradoras revisarán tu comprobante y te confirmarán por
            WhatsApp.{" "}
            {esBoleto && "Mucha suerte con tus números."}
          </p>
          <div className="rounded-lg bg-muted p-3 text-sm">
            {esBoleto ? (
              <>
                <p>
                  Números:{" "}
                  <strong>
                    #{props.numeros.sort((a, b) => a - b).join(", #")}
                  </strong>
                </p>
                <p>Total pagado: {formatearMxn(total)}</p>
              </>
            ) : (
              <>
                <p>
                  {cantidad} x {props.producto.nombre}
                </p>
                <p className="mt-1 text-base font-bold text-primary">
                  Total: {formatearMxn(total)}
                </p>
              </>
            )}
          </div>
          <Button onClick={handleClose} className="w-full">
            Listo
          </Button>
        </div>
      )}
    </DialogContent>
  );

  // Boleto: controlado externamente
  if (esBoleto) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  // Producto: trigger interno
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={props.trigger} />
      {dialogContent}
    </Dialog>
  );
}
