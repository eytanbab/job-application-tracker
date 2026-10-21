import { SpeedInsights } from "@vercel/speed-insights/next";
import { cookies } from "next/headers";
import { GuestNotice } from "@/app/_components/guest-notice";
import { GUEST_NOTICE_COOKIE } from "@/lib/guest-notice";
import { getClerkUserId } from "@/lib/auth/clerk-session";

export const dynamic = "force-dynamic";

export default async function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [clerkUserId, cookieStore] = await Promise.all([getClerkUserId(), cookies()]);
  const noticeDismissed = cookieStore.get(GUEST_NOTICE_COOKIE)?.value === "1";

  return (
    <main className="p-3 sm:p-4 md:p-6 w-full max-w-[1920px] mx-auto overflow-x-hidden min-w-0">
      {!clerkUserId && <GuestNotice initialDismissed={noticeDismissed} />}
      {children}
      {/* TODO: move to app/layout.tsx once the Phase 0 layout changes land,
          so "/" and the auth pages are measured too */}
      <SpeedInsights />
    </main>
  );
}
