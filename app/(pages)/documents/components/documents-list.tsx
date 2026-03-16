import Link from "next/link";
import { FileText, SearchX } from "lucide-react";

import { getFiles } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { Document } from "./document";

type Props = {
  query?: string;
};

export const DocumentsList = async ({ query }: Props) => {
  let docs = await getFiles();

  if (query) {
    const lowQuery = query.toLowerCase();
    docs = docs.filter(
      (doc) =>
        doc.title.toLowerCase().includes(lowQuery) ||
        doc.file_name.toLowerCase().includes(lowQuery)
    );
  }

  if (!docs || docs.length === 0) {
    if (query) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-muted/10 p-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No results found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              We couldn&apos;t find any documents matching &quot;{query}&quot;.
              Try a different search term.
            </p>
          </div>
          <Button variant="outline" asChild className="mt-2">
            <Link href="/documents">Clear Search</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-muted/10 p-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <FileText className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            Your document library is empty
          </h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Upload your resumes, cover letters, and other career assets to keep
            them organized in one place.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {docs.map((file) => (
        <Document key={file.id} file={file} />
      ))}
    </div>
  );
};
