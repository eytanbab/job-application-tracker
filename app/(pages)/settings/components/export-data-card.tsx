import Link from "next/link";
import { FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pluralize } from "./pluralize";

export interface DataCounts {
  applications: number;
  statusHistory: number;
  documents: number;
}

export function ExportDataCard({ counts }: { counts: DataCounts }) {
  return (
    <Card className="gap-4 rounded-xl border-border/30 p-5">
      <CardHeader>
        <CardTitle className="text-base">Export your data</CardTitle>
        <CardDescription>
          Download a copy of everything you&apos;ve saved:{" "}
          {pluralize(counts.applications, "application")},{" "}
          {pluralize(counts.statusHistory, "status change")} and{" "}
          {pluralize(counts.documents, "document")}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <a href="/api/account/export?format=json" download>
              <FileJson />
              Download JSON
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/account/export?format=csv" download>
              <FileSpreadsheet />
              Download CSV
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          JSON includes applications, status history and document details. CSV
          includes applications only and opens in Excel or Google Sheets. Download
          resume files themselves from{" "}
          <Link
            href="/documents"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Documents
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
