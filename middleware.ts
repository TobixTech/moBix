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

  if (isHomeRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  if (isProtectedAdminRoute(req)) {
    const adminVerifiedCookie = req.cookies.get("admin_access_verified")

    if (!adminVerifiedCookie?.value) {
      return NextResponse.redirect(new URL("/admin/access-key", req.url))
    }

    // Check if cookie has expired (6 hour session)
    const expiryTime = Number.parseInt(adminVerifiedCookie.value, 10)
    if (isNaN(expiryTime) || Date.now() > expiryTime) {
      // Session expired, redirect to access key page
      const response = NextResponse.redirect(new URL("/admin/access-key", req.url))
      // Clear the expired cookie
      response.cookies.set("admin_access_verified", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      })
      return response
    }
  }

  if (isAdminAccessKeyRoute(req)) {
    // Allow access to access-key page without any auth
    return NextResponse.next()
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
