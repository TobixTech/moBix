import { execSync } from "child_process"

try {
  console.log("Running drizzle-kit push...")
  execSync("npx drizzle-kit push", { stdio: "inherit" })
  console.log("Schema pushed successfully!")
} catch (error) {
  console.error("Failed to push schema:", error)
  process.exit(1)
}
