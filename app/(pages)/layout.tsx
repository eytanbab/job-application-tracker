export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className='p-8 flex items-center justify-center w-full'>
      {children}
    </main>
  );
}
