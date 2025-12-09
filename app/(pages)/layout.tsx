export const dynamic = 'force-dynamic';

export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className='p-6 flex items-center justify-center w-full overflow-hidden'>
      {children}
    </main>
  );
}
