import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { allowsDevFallbacks, getClerkPublishableKey } from "@/lib/env";
import { signGuestId, verifyGuestId } from "@/lib/security/guest-token";

const isProtectedRoute = createRouteMatcher([
  // '/applications(.*)',
  // '/analytics(.*)',
  // '/documents(.*)'
]);

/** Gives signed-out visitors a signed guest cookie if they lack a valid one. */
function withGuestCookie(req: NextRequest, res: NextResponse, userId: string | null) {
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
  return res;
}

function getRedirect(req: NextRequest): NextResponse | null {
  // Redirect logged-in users from the homepage to /applications
  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/applications", req.url));
  }

  if (req.nextUrl.pathname === "/analytics") {
    return NextResponse.redirect(new URL("/analytics/overview", req.url));
  }

  return null;
}

const withClerk = clerkMiddleware(
  async (auth, req) => {
    const { userId } = await auth();
    const res = withGuestCookie(req, NextResponse.next(), userId);

    const redirect = getRedirect(req);
    if (redirect) return redirect;

    if (isProtectedRoute(req)) await auth.protect();

    return res;
  },
  () => ({ publishableKey: getClerkPublishableKey() }),
);

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  // Without Clerk keys (development and DEMO_MODE only; lib/env.ts requires
  // them in production) every visitor is a guest, so Clerk is skipped.
  if (!process.env.CLERK_SECRET_KEY && allowsDevFallbacks()) {
    return getRedirect(req) ?? withGuestCookie(req, NextResponse.next(), null);
  }
  return withClerk(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
