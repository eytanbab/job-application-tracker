export const dynamic = 'force-dynamic';

export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className='w-full overflow-hidden'>
      {children}
    </main>
  );
}
