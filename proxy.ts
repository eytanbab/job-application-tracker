import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { signGuestId, verifyGuestId } from "@/lib/security/guest-token";

const isProtectedRoute = createRouteMatcher([
  // '/applications(.*)',
  // '/analytics(.*)',
  // '/documents(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  const res = NextResponse.next();

  if (!userId) {
    const rawGuestCookie = req.cookies.get("guest_id")?.value;
    const validGuestId = verifyGuestId(rawGuestCookie);

    if (!validGuestId) {
      const newGuestId = crypto.randomUUID();
      const signedToken = signGuestId(newGuestId);
      res.cookies.set("guest_id", signedToken, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }
  }

  // Redirect logged-in users from the homepage to /applications
  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/applications", req.url));
  }

  if (req.nextUrl.pathname === "/analytics") {
    return NextResponse.redirect(new URL("/analytics/overview", req.url));
  }

  if (isProtectedRoute(req)) await auth.protect();

  return res;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
