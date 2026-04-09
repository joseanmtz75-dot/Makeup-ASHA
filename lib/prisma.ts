import { PrismaClient } from "@prisma/client";

// Lazy singleton via Proxy — evita instanciar Prisma en build/edge
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma ??
  new Proxy({} as PrismaClient, {
    get(_target, prop) {
      if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = createPrismaClient();
      }
      return Reflect.get(globalForPrisma.prisma, prop);
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = globalForPrisma.prisma;
}
