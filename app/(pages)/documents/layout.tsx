export const dynamic = 'force-dynamic';

export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className='flex items-center justify-center w-full'>{children}</main>
  );
}
