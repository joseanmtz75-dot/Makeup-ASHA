import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fija el root del workspace para Turbopack (evita auto-detección incorrecta
  // cuando hay package-lock.json en el directorio padre).
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Imágenes remotas permitidas (Supabase Storage).
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gjlxcgdiadmsunoaboms.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
