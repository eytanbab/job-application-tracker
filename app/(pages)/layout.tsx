import { GuestNotice } from "@/app/_components/guest-notice";
import { getClerkUserId } from "@/lib/auth/clerk-session";

export const dynamic = "force-dynamic";

export default async function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkUserId = await getClerkUserId();

  return (
    <main className="p-3 sm:p-4 md:p-6 w-full max-w-[1920px] mx-auto overflow-x-hidden min-w-0">
      {!clerkUserId && <GuestNotice />}
      {children}
    </main>
  );
}
