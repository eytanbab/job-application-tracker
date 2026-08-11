"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Briefcase, BarChart3, FileText, Sparkles } from "lucide-react";
import { NewApplicationButton } from "./new-application-button";

const navLinks = [
  { url: "/applications", name: "Applications", icon: Briefcase },
  { url: "/analytics/overview", name: "Analytics", icon: BarChart3 },
  { url: "/documents", name: "Documents", icon: FileText },
];

const SideNav = () => {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 left-0 z-40 hidden h-screen w-64 flex-none flex-col justify-between border-r border-border/30 bg-card/60 backdrop-blur-md p-4 md:flex">
      <div className="space-y-6">
        {/* Logo Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 px-2 py-1 group cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground">
              JobTracker
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Career Pipeline
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Menu
          </p>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const rootPath = item.url.split("/")[1];
            const isActive = pathname.startsWith(`/${rootPath}`);

            return (
              <Link
                key={item.url}
                href={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
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
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-border/40 pt-4 px-2">
        <p className="text-[11px] text-muted-foreground text-center">
          Job Application Tracker v2.0
        </p>
      </div>
    </aside>
  );
};

export default SideNav;
