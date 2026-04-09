import { prisma } from "@/lib/prisma";
import type { ConfiguracionSitio } from "@prisma/client";

/**
 * Obtiene la configuración del sitio. Si no existe, la crea con valores default.
 * Cachea con React's cache() para que en el mismo request server no se consulte 2 veces.
 */
export async function getConfiguracion(): Promise<ConfiguracionSitio> {
  const config = await prisma.configuracionSitio.findUnique({
    where: { id: "default" },
  });

  if (config) return config;

  // Crear con defaults la primera vez
  return prisma.configuracionSitio.create({
    data: { id: "default" },
  });
}
