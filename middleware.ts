import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isAdminRoute = createRouteMatcher(["/admin/dashboard(.*)"])
const isAdminAuthRoute = createRouteMatcher(["/admin/login", "/admin/signup"])
const isAdminAccessKeyRoute = createRouteMatcher(["/admin/access-key"])
const isPublicRoute = createRouteMatcher(["/", "/api/webhooks(.*)", "/sso-callback", "/login", "/signup"])
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"])
const isHomeRoute = createRouteMatcher(["/home(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  console.log("[v0] Middleware checking route:", req.nextUrl.pathname)
  console.log("[v0] User ID:", userId)
  console.log("[v0] User role:", sessionClaims?.metadata?.role)

  if (isHomeRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  if (isAdminRoute(req)) {
    if (!userId) {
      console.log("[v0] No user ID, redirecting to access key page")
      return NextResponse.redirect(new URL("/admin/access-key", req.url))
    }

    const userRole = sessionClaims?.metadata?.role
    if (userRole !== "admin") {
      console.log("[v0] User is not admin, redirecting to home")
      return NextResponse.redirect(new URL("/", req.url))
    }
    
    console.log("[v0] Admin access granted to dashboard")
  }

  if (isAdminAccessKeyRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    console.log("[v0] Allowing access to admin key page")
  }

  if (isDashboardRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  if (isAdminAuthRoute(req)) {
    // Allow access to show "UNDER DEVELOPMENT" message
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
