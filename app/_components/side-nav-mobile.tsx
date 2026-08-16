"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, Briefcase, BarChart3, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const mobileNavLinks = [
  { url: "/applications", name: "Applications", icon: Briefcase },
  { url: "/analytics/overview", name: "Analytics", icon: BarChart3 },
  { url: "/documents", name: "Documents", icon: FileText },
];

export function MobileSideNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg text-foreground hover:bg-accent cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[280px] sm:w-[320px] p-5 flex flex-col justify-between h-dvh max-h-dvh border-l border-border/40 bg-card text-card-foreground shadow-2xl"
      >
        <div className="space-y-6">
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <SheetTitle className="text-base font-bold tracking-tight text-foreground">
                JobTracker
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Career pipeline & applications
            </SheetDescription>
          </SheetHeader>

          <nav aria-label="Mobile Navigation" className="space-y-1.5 pt-2">
            {mobileNavLinks.map((item) => {
              const Icon = item.icon;
              const rootPath = item.url.split("/")[1];
              const isActive = pathname.startsWith(`/${rootPath}`);

              return (
                <Link
                  key={item.url}
                  href={item.url}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border/40 pt-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <p className="text-[11px] text-muted-foreground text-center">
            Job Application Tracker v2.0
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
