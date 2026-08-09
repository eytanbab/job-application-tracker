import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

import './globals.css';

import SideNav from './_components/side-nav';
import Nav from './_components/nav';
import { ThemeProvider } from '../lib/context/theme-provider';

import { Toaster } from '@/components/ui/toaster';

import { ClerkProvider } from '@clerk/nextjs';
import { GuestDataMigrator } from './_components/guest-data-migrator';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
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
      <html lang='en' suppressHydrationWarning>
        <body
          suppressHydrationWarning
          className={`${plusJakartaSans.variable} ${inter.variable} ${inter.className} min-h-screen antialiased`}
        >
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <NuqsAdapter>
              <Toaster />
              <div className="flex min-h-screen bg-background text-foreground">
                <SideNav />
                <div className="flex-1 flex flex-col min-w-0">
                  <Nav />
                  <GuestDataMigrator />
                  <div className="flex-1">{children}</div>
                </div>
              </div>
            </NuqsAdapter>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
