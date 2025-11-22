import { PrismaClient } from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

let prismaInstance: PrismaClient | undefined

export const prisma =
  global.prismaGlobal ||
  (() => {
    if (!prismaInstance) {
      try {
        prismaInstance = new PrismaClient({
          log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        })
      } catch (error) {
        console.error("[Prisma] Failed to initialize client:", error)
        // Return a dummy object during build time to prevent crashes
        return {} as PrismaClient
      }
    }
    return prismaInstance
  })()

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma
}
