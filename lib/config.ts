import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { ConfiguracionSitio } from "@prisma/client";

/**
 * Obtiene la configuración del sitio. Si no existe, la crea con valores default.
 * Usa React.cache() para deduplicar queries dentro del mismo request server.
 */
export const getConfiguracion = cache(
  async (): Promise<ConfiguracionSitio> => {
    const config = await prisma.configuracionSitio.findUnique({
      where: { id: "default" },
    });

    if (config) return config;

    // Crear con defaults la primera vez
    return prisma.configuracionSitio.create({
      data: { id: "default" },
    });
  }
);
