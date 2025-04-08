import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const isProtectedRoute = createRouteMatcher([
  // '/applications(.*)',
  // '/analytics(.*)',
  // '/documents(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  const res = NextResponse.next();

  if (!userId) {
    const guestId = req.cookies.get('guest_id')?.value;

    if (!guestId) {
      const newGuestId = uuidv4();
      res.cookies.set('guest_id', newGuestId, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }
  }

  // Redirect logged-in users from the homepage to /applications
  if (req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/applications', req.url));
  }

  if (req.nextUrl.pathname === '/analytics') {
    return NextResponse.redirect(new URL('/analytics/overview', req.url));
  }

  if (isProtectedRoute(req)) await auth.protect();

  return res;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
