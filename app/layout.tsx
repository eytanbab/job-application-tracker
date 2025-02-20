import type { Metadata } from 'next';
import { Work_Sans } from 'next/font/google';

import './globals.css';

import SideNav from './_components/side-nav';
import Nav from './_components/nav';
// import { ThemeProvider } from './_components/theme-provider';

import { Toaster } from '@/components/ui/toaster';

import { ClerkProvider } from '@clerk/nextjs';

const roboto = Work_Sans({
  weight: ['300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});
export const metadata: Metadata = {
  title: 'Job Application Tracker',
  description: 'Stay organized and focused on landing your dream job.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang='en'>
        <body
          className={`${roboto.className} antialiased bg-slate-100 text-indigo-600 h-screen`}
        >
          {/* <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
          > */}
          <Toaster />
          <Nav />
          <div className='flex'>
            <SideNav />
            {children}
          </div>
          {/* </ThemeProvider> */}
        </body>
      </html>
    </ClerkProvider>
  );
}
