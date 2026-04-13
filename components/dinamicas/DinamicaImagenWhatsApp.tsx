"use client";

import { forwardRef } from "react";
import { formatearMxnEntero } from "@/lib/utils/dineroMxn";
import type { EstatusBoleto, TipoDinamica } from "@prisma/client";
import { TIPO_DINAMICA_LABEL } from "@/lib/constants/dinamicas";

type BoletoImagen = {
  numero: number;
  estatus: EstatusBoleto;
  nombreComprador: string | null;
};

type DinamicaImagenProps = {
  nombre: string;
  tipo: TipoDinamica;
  precioBoleto: number;
  totalBoletos: number;
  premio: string;
  boletos: BoletoImagen[];
};

function estaOcupado(estatus: EstatusBoleto) {
  return (
    estatus === "RESERVADO" ||
    estatus === "PENDIENTE_VALIDACION" ||
    estatus === "CONFIRMADO" ||
    estatus === "CANCELACION_SOLICITADA"
  );
}

function truncarNombre(nombre: string | null, max: number = 14): string {
  if (!nombre) return "Apartado";
  if (nombre.length <= max) return nombre;
  return nombre.slice(0, max) + "…";
}

export const DinamicaImagenWhatsApp = forwardRef<
  HTMLDivElement,
  DinamicaImagenProps
>(function DinamicaImagenWhatsApp(
  { nombre, tipo, precioBoleto, totalBoletos, premio, boletos },
  ref
) {
  const ocupados = boletos.filter((b) => estaOcupado(b.estatus)).length;
  const disponibles = totalBoletos - ocupados - boletos.filter((b) => b.estatus === "CANCELADO").length;

  // Grid columns: list for ≤15, 2 columns for ≤30, 3 for more
  const columnas = totalBoletos <= 15 ? 1 : totalBoletos <= 30 ? 2 : 3;

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        minHeight: 800,
        background: "linear-gradient(135deg, #e879a8 0%, #c084fc 40%, #a855f7 70%, #e879a8 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#1f2937",
        position: "relative",
        overflow: "hidden",
        padding: 0,
      }}
    >
      {/* Sparkle decorations */}
      {[
        { top: 60, left: 80, size: 20, opacity: 0.4 },
        { top: 120, left: 900, size: 16, opacity: 0.3 },
        { top: 300, left: 50, size: 14, opacity: 0.25 },
        { top: 500, left: 980, size: 18, opacity: 0.35 },
        { top: 200, left: 500, size: 12, opacity: 0.2 },
        { top: 700, left: 150, size: 16, opacity: 0.3 },
        { top: 400, left: 850, size: 14, opacity: 0.25 },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            fontSize: s.size,
            opacity: s.opacity,
            color: "#fff",
            pointerEvents: "none",
          }}
        >
          ✦
        </div>
      ))}

      {/* Inner container with semi-transparent background */}
      <div
        style={{
          margin: 40,
          background: "rgba(255, 255, 255, 0.15)",
          borderRadius: 24,
          padding: "40px 48px",
          backdropFilter: "blur(10px)",
          border: "2px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "#fff",
              textShadow: "2px 2px 8px rgba(0,0,0,0.2)",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Makeup ASHA
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 20,
              color: "rgba(255,255,255,0.9)",
              fontWeight: 500,
            }}
          >
            Dinámica de participación
          </div>
        </div>

        {/* Dynamic name + info card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "24px 32px",
            marginBottom: 28,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#9333ea",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {nombre}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>
                Tipo
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#7c3aed" }}>
                {TIPO_DINAMICA_LABEL[tipo]}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>
                Premio
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#7c3aed" }}>
                {premio}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>
                Por boleto
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#7c3aed" }}>
                {formatearMxnEntero(precioBoleto)}
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            <span>{ocupados} apartados</span>
            <span>{disponibles} disponibles</span>
          </div>
          <div
            style={{
              height: 12,
              background: "rgba(255,255,255,0.3)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(ocupados / totalBoletos) * 100}%`,
                background: "linear-gradient(90deg, #ec4899, #f472b6)",
                borderRadius: 6,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>

        {/* Numbers grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columnas}, 1fr)`,
            gap: 8,
            marginBottom: 28,
          }}
        >
          {boletos.map((b) => {
            const ocupado = estaOcupado(b.estatus);
            const cancelado = b.estatus === "CANCELADO";

            return (
              <div
                key={b.numero}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: cancelado
                    ? "rgba(156, 163, 175, 0.3)"
                    : ocupado
                    ? "rgba(236, 72, 153, 0.25)"
                    : "rgba(255, 255, 255, 0.85)",
                  border: cancelado
                    ? "2px solid rgba(156, 163, 175, 0.5)"
                    : ocupado
                    ? "2px solid rgba(236, 72, 153, 0.5)"
                    : "2px solid rgba(255, 255, 255, 0.9)",
                }}
              >
                {/* Heart with number */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 18,
                    flexShrink: 0,
                    color: cancelado ? "#9ca3af" : ocupado ? "#fff" : "#9333ea",
                    background: cancelado
                      ? "#d1d5db"
                      : ocupado
                      ? "linear-gradient(135deg, #ec4899, #a855f7)"
                      : "#f3e8ff",
                    boxShadow: ocupado
                      ? "0 2px 8px rgba(236, 72, 153, 0.4)"
                      : "0 1px 4px rgba(0,0,0,0.08)",
                    textDecoration: cancelado ? "line-through" : "none",
                  }}
                >
                  {b.numero}
                </div>

                {/* Name or status */}
                <div
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: ocupado ? 600 : 400,
                    color: cancelado
                      ? "#9ca3af"
                      : ocupado
                      ? "#831843"
                      : "#6b7280",
                    textDecoration: cancelado ? "line-through" : "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cancelado
                    ? "Cancelado"
                    : ocupado
                    ? truncarNombre(b.nombreComprador)
                    : "Disponible"}
                </div>

                {/* Status dot */}
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: cancelado
                      ? "#9ca3af"
                      : ocupado
                      ? "#ec4899"
                      : "#22c55e",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            marginBottom: 24,
            fontSize: 14,
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
            <span>Disponible</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#ec4899",
              }}
            />
            <span>Apartado</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#fff",
              textShadow: "2px 2px 8px rgba(0,0,0,0.15)",
              marginBottom: 8,
            }}
          >
            ¡MUCHA SUERTE!
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Dinámica de participación · Solo mayores de 18 años
          </div>
        </div>
      </div>
    </div>
  );
});
