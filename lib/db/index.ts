import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

function createDb() {
  if (!process.env.DATABASE_URL) {
    // Return a proxy that throws helpful errors only when actually used
    return new Proxy({} as ReturnType<typeof drizzle>, {
      get(_, prop) {
        if (prop === "then") return undefined // Prevent promise resolution issues
        throw new Error(`DATABASE_URL is not defined. Cannot access db.${String(prop)}`)
      },
    })
  }

  const sql = neon(process.env.DATABASE_URL)
  return drizzle(sql, { schema })
}

export const db = createDb()
