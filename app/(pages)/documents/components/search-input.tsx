"use client";

import { useQueryState, parseAsString } from "nuqs";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput({ defaultValue }: { defaultValue?: string }) {
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString
      .withDefault(defaultValue || "")
      .withOptions({ shallow: false, throttleMs: 300 })
  );

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Search documents..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9 pr-8 h-9 text-xs shadow-2xs"
      />
      {query.length > 0 && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setQuery("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
