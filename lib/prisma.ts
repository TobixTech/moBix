import type { PrismaClient as PrismaClientType } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined
}

let prismaInstance: PrismaClientType | undefined

function getPrismaClient(): PrismaClientType {
  if (!prismaInstance) {
    // Dynamic import to avoid loading during prisma generate
    const { PrismaClient } = require("@prisma/client")

    prismaInstance =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      })

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance
    }
  }
  return prismaInstance
}

export const prisma = new Proxy({} as PrismaClientType, {
  get(target, prop) {
    const client = getPrismaClient()
    return client[prop as keyof PrismaClientType]
  },
})
