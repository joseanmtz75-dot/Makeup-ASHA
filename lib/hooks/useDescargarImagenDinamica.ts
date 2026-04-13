"use client";

import { useState, type RefObject } from "react";
import { toast } from "sonner";

export function useDescargarImagenDinamica() {
  const [generando, setGenerando] = useState(false);

  async function descargar(
    elementRef: RefObject<HTMLDivElement | null>,
    nombreArchivo: string
  ) {
    if (!elementRef.current) return;
    setGenerando(true);

    try {
      const { toJpeg } = await import("html-to-image");
      const dataUrl = await toJpeg(elementRef.current, {
        quality: 0.92,
        pixelRatio: 2,
        backgroundColor: "#a855f7",
      });

      const link = document.createElement("a");
      link.download = `${nombreArchivo}.jpg`;
      link.href = dataUrl;
      link.click();
      toast.success("Imagen descargada");
    } catch {
      toast.error("Error al generar la imagen");
    } finally {
      setGenerando(false);
    }
  }

  return { generando, descargar };
}
