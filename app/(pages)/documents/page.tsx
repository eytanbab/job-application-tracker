import { Suspense } from "react";
import { FileUpload } from "./components/file-upload";
import { DocumentsList } from "./components/documents-list";
import { SearchInput } from "./components/search-input";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata() {
  return { title: "JAT | Documents" };
}

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function Documents({ searchParams }: Props) {
  const { q: query } = await searchParams;

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-8">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Career Documents
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Securely store and manage your resumes, cover letters, and
            portfolios.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <FileUpload />
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Suspense fallback={<Skeleton className="h-10 w-full max-w-sm" />}>
            <SearchInput key={query} defaultValue={query} />
          </Suspense>
          <div className="hidden sm:block text-sm text-muted-foreground font-medium">
            Keep your professional assets up to date.
          </div>
        </div>

        <Suspense fallback={<DocumentsSkeleton />}>
          <DocumentsList query={query} />
        </Suspense>
      </div>
    </div>
  );
}

function DocumentsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border bg-card p-5 space-y-4 shadow-sm"
        >
          <div className="flex justify-between items-start">
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="pt-5 border-t flex justify-between items-center">
            <Skeleton className="h-3 w-16 sm:w-20" />
            <Skeleton className="h-9 w-24 sm:w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
