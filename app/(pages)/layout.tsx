export const dynamic = "force-dynamic";

export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="p-4 md:p-6 w-full max-w-[1920px] mx-auto overflow-x-hidden">
      {children}
    </main>
  );
}
