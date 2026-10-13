import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="p-3 sm:p-4 md:p-6 w-full max-w-[1920px] mx-auto">
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-muted p-2 text-muted-foreground shrink-0">
                <SearchX className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-sm text-muted-foreground">
                Check the address, or head back to your applications.
              </p>
            </div>
            <div className="flex sm:justify-end">
              <Button variant="outline" asChild>
                <Link href="/applications">
                  <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Back to Applications
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
