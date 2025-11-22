import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaInstance: PrismaClient | undefined

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!prismaInstance) {
      try {
        prismaInstance =
          globalForPrisma.prisma ??
          new PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
          })

        if (process.env.NODE_ENV !== "production") {
          globalForPrisma.prisma = prismaInstance
        }
      } catch (error) {
        // During build/generate phase, Prisma client might not be available yet
        console.warn("[Prisma] Client not available yet, this is expected during build")
        throw error
      }
    }
    return prismaInstance[prop as keyof PrismaClient]
  },
})
