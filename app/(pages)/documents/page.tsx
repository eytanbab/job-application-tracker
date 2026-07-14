import { Suspense } from "react";
import { FileUpload } from "./components/file-upload";
import { DocumentsList } from "./components/documents-list";
import { SearchInput } from "./components/search-input";
import { LayoutToggle } from "./components/layout-toggle";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata() {
  return { title: "JAT | Documents" };
}

type Props = {
  searchParams: Promise<{ q?: string; view?: "table" | "grid" }>;
};

export default async function Documents({ searchParams }: Props) {
  const { q: query, view = "table" } = await searchParams;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Career Documents
        </h1>
        <p className="text-sm text-muted-foreground">
          Securely store and manage your resumes, cover letters, and portfolios.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <Suspense fallback={<Skeleton className="h-10 w-full max-w-sm" />}>
          <SearchInput key={query} defaultValue={query} />
        </Suspense>
        <div className="flex items-center gap-3">
          <LayoutToggle currentView={view} />
          <FileUpload />
        </div>
      </div>

      <div className="mt-2">
        <Suspense fallback={<DocumentsSkeleton view={view} />}>
          <DocumentsList query={query} view={view} />
        </Suspense>
      </div>
    </div>
  );
}

function DocumentsSkeleton({ view }: { view: "table" | "grid" }) {
  if (view === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-5 space-y-4 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex gap-1.5">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4.5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
            <div className="pt-4 border-t border-border/50 flex justify-between items-center">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="p-4 space-y-4">
        {/* Mock Header Row */}
        <div className="flex gap-4 border-b border-border/40 pb-4">
          <Skeleton className="h-5 w-[45%]" />
          <Skeleton className="h-5 w-[30%]" />
          <Skeleton className="h-5 w-[15%]" />
          <Skeleton className="h-5 w-[10%]" />
        </div>
        {/* Mock Data Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-2">
            <Skeleton className="h-5 w-[45%]" />
            <Skeleton className="h-4 w-[30%]" />
            <Skeleton className="h-4 w-[15%]" />
            <div className="flex gap-1.5 justify-end w-[10%]">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
