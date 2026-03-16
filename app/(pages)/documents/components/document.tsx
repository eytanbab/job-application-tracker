"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Trash2,
  Download,
  FileText,
  Loader2,
  MoreVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type Props = {
  file: {
    id: string;
    doc_url: string;
    title: string;
    created_at: Date;
    file_name: string;
  };
};

export const Document = ({ file }: Props) => {
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

  return (
    <Card className="group relative flex h-full w-full flex-col overflow-hidden border bg-card shadow-sm transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20">
      <div className="flex flex-1 flex-col p-2 w-full">
        <div className="flex items-start justify-between w-full mb-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <FileText className="h-6 w-6" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground rounded-full transition-colors active:bg-muted"
              >
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link
                  href={file.doc_url}
                  target="_blank"
                  className="flex items-center gap-3 py-3 text-base sm:text-sm"
                >
                  <Eye className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span>View Online</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <Dialog>
                <DialogTrigger asChild>
                  <button className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-3 text-base sm:text-sm font-semibold outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive">
                    <div className="flex items-center gap-3">
                      <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                      <span>Remove Document</span>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl font-bold">
                      Delete Document
                    </DialogTitle>
                    <DialogDescription className="text-base sm:text-lg pt-4 leading-relaxed">
                      Are you sure you want to delete{" "}
                      <span className="font-bold text-foreground decoration-primary/30 underline underline-offset-4">
                        &quot;{file.title}&quot;
                      </span>
                      ? This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-8 gap-4 sm:gap-3">
                    <DialogClose asChild>
                      <Button
                        variant="destructive"
                        className="h-12 sm:h-11 text-base sm:text-sm font-bold w-full sm:w-auto min-w-[140px]"
                        disabled={isDeleting}
                        onClick={handleDelete}
                      >
                        Delete
                      </Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button
                        variant="outline"
                        className="h-12 sm:h-11 text-base sm:text-sm font-semibold w-full sm:w-auto"
                        disabled={isDeleting}
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 flex flex-col w-full mb-8">
          <div className="h-[4.5rem] w-full">
            <h3
              className="line-clamp-2 font-semibold text-foreground group-hover:text-primary transition-colors break-words"
              title={file.title}
            >
              {file.title}
            </h3>
          </div>
          <p
            className="line-clamp-1 text-sm text-muted-foreground/80 font-medium break-all"
            title={file.file_name}
          >
            {file.file_name}
          </p>
        </div>

        <div className="mt-auto pt-6 border-t border-muted/50 w-full flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold leading-none">
              Uploaded
            </span>
            <div className="flex items-center gap-2 text-sm text-foreground/90 font-bold whitespace-nowrap overflow-hidden">
              <Calendar className="h-4 w-4 text-primary/60 shrink-0" />
              <span className="truncate">
                {format(file.created_at, "MMM d, yyyy")}
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="h-11 sm:h-10 px-5 sm:px-6 text-sm font-bold gap-2 shadow-sm active:scale-95 transition-all"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden xs:inline">Download</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
