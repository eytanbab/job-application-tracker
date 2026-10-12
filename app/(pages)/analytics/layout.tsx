import { Suspense } from "react";
import Tabs from "@/app/_components/tabs";

export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col w-full h-full gap-4 min-w-0">
      <Suspense
        fallback={
          <div className="h-9 w-48 bg-muted/40 rounded-xl animate-pulse" />
        }
      >
        <Tabs />
      </Suspense>
      {children}
    </div>
  );
}
