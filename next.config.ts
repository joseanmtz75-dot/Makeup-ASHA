import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
