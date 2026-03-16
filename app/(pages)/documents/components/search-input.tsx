"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue || "");

  // Sync internal state with prop (useful when search is cleared externally)
  useEffect(() => {
    setValue(defaultValue || "");
  }, [defaultValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQuery = searchParams.get("q") || "";
      if (value !== currentQuery) {
        const params = new URLSearchParams(searchParams);
        if (value) params.set("q", value);
        else params.delete("q");

        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search documents..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10 h-10 shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
      />
      {isPending ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        value && (
          <button
            onClick={() => setValue("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )
      )}
    </div>
  );
}
