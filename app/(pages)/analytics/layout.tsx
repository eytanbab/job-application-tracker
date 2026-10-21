import { AnalyticsHeader } from "./components/analytics-header";

export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col w-full h-full gap-4 min-w-0">
      <AnalyticsHeader />
      {children}
    </div>
  );
}
