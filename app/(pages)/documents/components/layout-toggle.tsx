"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LayoutToggle({ currentView }: { currentView: "table" | "grid" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleToggle = (view: "table" | "grid") => {
    const params = new URLSearchParams(searchParams);
    params.set("view", view);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center border border-border/60 rounded-lg p-0.5 bg-muted/20">
      <Button
        variant={currentView === "table" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => handleToggle("table")}
        className="h-8 w-8 rounded-md"
        title="List View"
      >
        <List className="h-4 w-4" />
        <span className="sr-only">List View</span>
      </Button>
      <Button
        variant={currentView === "grid" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => handleToggle("grid")}
        className="h-8 w-8 rounded-md"
        title="Grid View"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="sr-only">Grid View</span>
      </Button>
    </div>
  );
}
