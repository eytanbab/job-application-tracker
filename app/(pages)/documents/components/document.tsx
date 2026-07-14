"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Trash2,
  Download,
  FileText,
  Loader2,
  Calendar,
  Eye,
} from "lucide-react";

import { deleteFile, getDownloadUrl } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type Props = {
  file: {
    id: string;
    doc_url: string;
    title: string;
    created_at: Date;
    file_name: string;
  };
  view?: "table" | "grid";
};

export const Document = ({ file, view = "table" }: Props) => {
  const { toast } = useToast();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDelete = async () => {
    startDeleteTransition(async () => {
      try {
        await deleteFile(file.id);
        toast({ description: "successfully deleted document!" });
      } catch (err) {
        console.error(err);
        toast({
          description: "Failed to delete document.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { url, error } = await getDownloadUrl(file.id);
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = file.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast({
          description: error || "Failed to generate download link.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        description: "Failed to download file.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper for rendering Quick Actions
  const renderActions = (iconSizeClass = "h-4 w-4") => (
    <>
      <Button
        variant="ghost"
        size="icon"
        asChild
        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md transition-colors"
        title="View Online"
      >
        <Link href={file.doc_url} target="_blank">
          <Eye className={iconSizeClass} />
          <span className="sr-only">View Online</span>
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        disabled={isDownloading}
        onClick={handleDownload}
        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md transition-colors"
        title="Download File"
      >
        {isDownloading ? (
          <Loader2 className={`${iconSizeClass} animate-spin`} />
        ) : (
          <Download className={iconSizeClass} />
        )}
        <span className="sr-only">Download</span>
      </Button>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-md transition-colors"
            title="Remove Document"
          >
            <Trash2 className={iconSizeClass} />
            <span className="sr-only">Remove</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Delete Document
            </DialogTitle>
            <DialogDescription className="pt-2 leading-relaxed text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground underline underline-offset-4">
                &quot;{file.title}&quot;
              </span>
              ? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-3">
            <DialogClose asChild>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant="outline"
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // GRID CARD VIEW RENDERER
  if (view === "grid") {
    return (
      <Card className="group relative flex flex-col items-stretch text-left rounded-xl border border-border/50 bg-card/45 backdrop-blur-sm p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5">
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
              {renderActions("h-3.5 w-3.5")}
            </div>
          </div>

          <div className="space-y-0.5 w-full text-left">
            <h3
              className="font-semibold text-sm text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors duration-200"
              title={file.title}
            >
              {file.title}
            </h3>
            <p
              className="text-xs text-muted-foreground/75 truncate"
              title={file.file_name}
            >
              {file.file_name}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-center w-full text-[11px] text-muted-foreground/80">
          <span className="flex items-center gap-1 font-medium">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
            {format(file.created_at, "dd/MM/yyyy")}
          </span>
          <span className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-bold text-[9px] tracking-wider uppercase">
            PDF
          </span>
        </div>
      </Card>
    );
  }

  // TABLE ROW VIEW RENDERER
  return (
    <TableRow className="group/row transition-colors">
      <TableCell className="font-medium py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <span className="truncate max-w-[280px] sm:max-w-sm font-semibold text-foreground" title={file.title}>
            {file.title}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground py-3 truncate max-w-[200px] sm:max-w-xs" title={file.file_name}>
        {file.file_name}
      </TableCell>
      <TableCell className="py-3 text-muted-foreground whitespace-nowrap">
        {format(file.created_at, "dd/MM/yyyy")}
      </TableCell>
      <TableCell className="py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {renderActions("h-4 w-4")}
        </div>
      </TableCell>
    </TableRow>
  );
};
