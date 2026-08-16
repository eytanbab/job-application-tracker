"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import { MobileSideNav } from "./side-nav-mobile";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  applications: "Job Applications",
  analytics: "Analytics & Performance",
  documents: "Career Documents",
};

const Nav = () => {
  const pathname = usePathname();
  const rootSection = pathname.split("/")[1] || "applications";
  const currentTitle = pageTitles[rootSection] || "Job Tracker";

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/30 bg-background/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Mobile Logo & Desktop Page Title */}
      <div className="flex items-center gap-3">
        {/* Mobile-only Logo */}
        <Link
          href="/"
          className="flex md:hidden items-center gap-2 group cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            JobTracker
          </span>
        </Link>

        {/* Desktop Breadcrumb/Page Title */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-muted-foreground font-medium">Dashboard</span>
          <span className="text-muted-foreground/60">/</span>
          <span className="font-semibold text-foreground">{currentTitle}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        <ModeToggle />
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button
              size="sm"
              className="h-8 px-3 text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
            >
              Sign In
            </Button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>

        {/* Mobile Hamburger Drawer Trigger (< md only) */}
        <div className="md:hidden">
          <MobileSideNav />
        </div>
      </div>
    </header>
  );
};

export default Nav;
