import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isAdminAuthRoute = createRouteMatcher(["/admin/login", "/admin/signup"])
const isAdminAccessKeyRoute = createRouteMatcher(["/admin/access-key"])
const isProtectedAdminRoute = createRouteMatcher(["/admin/dashboard(.*)", "/admin/seed", "/admin/point"])
const isPublicRoute = createRouteMatcher(["/", "/api/webhooks(.*)", "/sso-callback", "/login", "/signup"])
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"])
const isHomeRoute = createRouteMatcher(["/home(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  console.log("[v0] Middleware checking route:", req.nextUrl.pathname)

  if (isHomeRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  if (isProtectedAdminRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/admin/login", req.url))
    }
    const adminVerified = req.cookies.get("admin_access_verified")
    if (!adminVerified) {
      return NextResponse.redirect(new URL("/admin/access-key", req.url))
    }
  }

  if (isAdminAccessKeyRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  if (isDashboardRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  if (isAdminAuthRoute(req)) {
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
