"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatearMxn } from "@/lib/utils/dineroMxn";
import { MUNICIPIOS_OPTIONS } from "@/lib/constants/municipios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2, X, Ticket } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  dinamicaId: string;
  dinamicaNombre: string;
  numeros: number[];
  precioBoleto: number;
  total: number;
};

type Step = "datos" | "pago" | "confirmacion";

export function CheckoutBoletos({
  open,
  onClose,
  dinamicaId,
  dinamicaNombre,
  numeros,
  precioBoleto,
  total,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("datos");
  const [isPending, startTransition] = useTransition();
  const [subiendo, setSubiendo] = useState(false);

  // Datos clienta
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [municipio, setMunicipio] = useState("");

  // Pago
  const [metodoPago, setMetodoPago] = useState<
    "TRANSFERENCIA" | "EFECTIVO" | "OXXO"
  >("TRANSFERENCIA");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [comprobantePath, setComprobantePath] = useState<string | null>(null);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);

  function reset() {
    setStep("datos");
    setNombre("");
    setTelefono("");
    setDireccion("");
    setMunicipio("");
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
        toast.error("Escribe tu dirección para la entrega");
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

  function confirmarReserva() {
    if (!comprobantePath) {
      toast.error("Sube tu comprobante de pago");
      return;
    }

    const payload = {
      dinamicaId,
      numeros,
      nombre: nombre.trim(),
      telefono: telefono.replace(/\D/g, ""),
      direccion: direccion.trim(),
      municipio,
      metodoPago,
      comprobantePath,
      referenciaPago: referenciaPago.trim() || null,
    };

    startTransition(async () => {
      const res = await fetch("/api/boletos/reservar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("No se pudo reservar", {
          description: err.error,
        });
        return;
      }

      setStep("confirmacion");
    });
  }

  function cerrar() {
    onClose();
    setTimeout(() => {
      reset();
      router.refresh();
    }, 300);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) cerrar();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "confirmacion"
              ? "Listo"
              : `Participar en ${dinamicaNombre}`}
          </DialogTitle>
        </DialogHeader>

        {/* Resumen de selección */}
        {step !== "confirmacion" && (
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Ticket className="h-4 w-4 text-primary" />
              <span>
                {numeros.length}{" "}
                {numeros.length === 1 ? "boleto" : "boletos"}:{" "}
                <strong>
                  #{numeros.sort((a, b) => a - b).join(", #")}
                </strong>
              </span>
            </div>
            <div className="mt-1 text-right text-lg font-bold text-primary">
              Total: {formatearMxn(total)}
            </div>
          </div>
        )}

        {/* Paso 1: Datos */}
        {step === "datos" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cb-nombre">Tu nombre *</Label>
              <Input
                id="cb-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre completo"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cb-telefono">WhatsApp (10 dígitos) *</Label>
              <Input
                id="cb-telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="3312345678"
                maxLength={15}
                type="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cb-direccion">Dirección de entrega *</Label>
              <Input
                id="cb-direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número, colonia..."
                maxLength={300}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cb-municipio">Municipio *</Label>
              <select
                id="cb-municipio"
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

            <Button onClick={siguientePaso} className="w-full">
              Siguiente: Pago
            </Button>
          </div>
        )}

        {/* Paso 2: Pago */}
        {step === "pago" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Método de pago</Label>
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
              <div className="space-y-2">
                <Label htmlFor="cb-ref">
                  Referencia de pago (últimos 4 dígitos)
                </Label>
                <Input
                  id="cb-ref"
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  placeholder="Opcional"
                  maxLength={100}
                />
              </div>
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
                    id="cb-comprobante"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) subirComprobante(f);
                      e.target.value = "";
                    }}
                    disabled={subiendo}
                    className="hidden"
                  />
                  <Label
                    htmlFor="cb-comprobante"
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
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("datos")}
                className="flex-1"
              >
                Atrás
              </Button>
              <Button
                onClick={confirmarReserva}
                disabled={isPending || !comprobantePath}
                className="flex-1"
              >
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar
              </Button>
            </div>
          </div>
        )}

        {/* Paso 3: Confirmación */}
        {step === "confirmacion" && (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
            <h3 className="text-xl font-bold">Tus números están registrados</h3>
            <p className="text-muted-foreground">
              Las administradoras revisarán tu comprobante y te confirmarán
              por WhatsApp. Mucha suerte con tus números.
            </p>
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p>
                Números:{" "}
                <strong>
                  #{numeros.sort((a, b) => a - b).join(", #")}
                </strong>
              </p>
              <p>Total pagado: {formatearMxn(total)}</p>
            </div>
            <Button onClick={cerrar} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
