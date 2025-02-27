import Tabs from '@/app/_components/tabs';

export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className='flex flex-col w-full h-full gap-4'>
      <Tabs />
      {children}
    </main>
  );
}
