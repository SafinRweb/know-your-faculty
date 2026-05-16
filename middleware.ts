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
    const onboardingUrl = new URL("/onboarding", req.url);
    // Preserve where the user was trying to go
    if (pathname !== "/") {
      onboardingUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(onboardingUrl);
  }

  // Protect admin routes
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!session || user?.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Run middleware on ALL routes except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, icon.png, static assets
     * - /api/auth (NextAuth endpoints must not be intercepted)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|api/auth).*)",
  ],
};