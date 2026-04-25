import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const user = session?.user as any;

  // Redirect new students to onboarding
  if (
    session &&
    !user?.isAdmin &&
    user?.isSetup === false &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/api")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Protect admin routes
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!session || user?.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Protect review routes
  if (pathname.includes("/review")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/faculty/:path*/review",
    "/onboarding",
  ],
};