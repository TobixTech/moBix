import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isAdminRoute = createRouteMatcher(["/admin/dashboard(.*)"])
const isAdminAuthRoute = createRouteMatcher(["/admin/login", "/admin/signup"])
const isPublicRoute = createRouteMatcher(["/", "/api/webhooks(.*)", "/sso-callback", "/login", "/signup"])
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"])
const isHomeRoute = createRouteMatcher(["/home(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  if (isHomeRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  if (isAdminRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/admin/login", req.url))
    }

    const userRole = sessionClaims?.metadata?.role
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url))
    }
  }

  if (isDashboardRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  if (isAdminAuthRoute(req)) {
    if (userId && sessionClaims?.metadata?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url))
    }
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
