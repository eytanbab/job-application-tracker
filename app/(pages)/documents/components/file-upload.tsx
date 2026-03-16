"use client";

import { useTransition, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Upload, FileUp, X, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createFile, generatePresignedUrl } from "@/app/actions/documents";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const FILE_SIZE_LIMIT = 10 * 1024 * 1024;

const FormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  file: z
    .custom<File>((val) => val instanceof File, { message: "File is required" })
    .refine((file) => file.size <= FILE_SIZE_LIMIT, {
      message: "File size should not exceed 10MB",
    })
    .refine((file) => file.type === "application/pdf", {
      message: "Only PDF files are allowed",
    }),
});

export function FileUpload() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { title: "" },
  });

  const selectedFile = form.watch("file");

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const { title, file } = data;
    startTransition(async () => {
      try {
        const { fileKey, signedUrl, error } = await generatePresignedUrl(
          file.name,
          file.type
        );

        if (error) {
          toast({ description: error, variant: "destructive" });
          return;
        }

        if (signedUrl) {
          const res = await fetch(signedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          if (res.ok) {
            const fileUrl = signedUrl.split("?")[0];
            await createFile(title, fileUrl, file.name, fileKey);
            toast({
              description: (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Document uploaded successfully!</span>
                </div>
              ),
            });
            form.reset();
            setIsOpen(false);
          } else {
            toast({
              description: "Failed to upload to storage.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      form.setValue("file", file);
      if (!form.getValues("title")) {
        form.setValue("title", file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 sm:h-10 px-5 sm:px-4 gap-2 shadow-sm text-base sm:text-sm font-bold">
          <Upload className="h-5 w-5 sm:h-4 sm:w-4" />
          <span>Upload Document</span>
        </Button>
      </DialogTrigger>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Upload Document
          </DialogTitle>
          <DialogDescription className="text-base sm:text-sm pt-2">
            Add a new resume, cover letter, or portfolio. PDF only, max 10MB.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Document Label
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Senior Frontend Resume 2026"
                      className="h-11 sm:h-10 text-base sm:text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange } }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    File Attachment
                  </FormLabel>
                  <FormControl>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={onKeyDown}
                      role="button"
                      tabIndex={0}
                      aria-label="File dropzone"
                      className={cn(
                        "group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-10 transition-all cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/20",
                        selectedFile ? "bg-muted/30 border-primary/50" : ""
                      )}
                    >
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                            if (!form.getValues("title")) {
                              form.setValue(
                                "title",
                                file.name.replace(/\.[^/.]+$/, "")
                              );
                            }
                          }
                        }}
                      />

                      {selectedFile ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                            <CheckCircle2 className="h-8 w-8 text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="text-base sm:text-sm font-bold text-foreground max-w-[240px] truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-sm sm:text-xs text-muted-foreground mt-0.5">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-sm sm:text-xs h-8 gap-2 hover:text-destructive font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              form.setValue("file", null as unknown as File);
                            }}
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                            <FileUp className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="mt-5 text-center">
                            <p className="text-base sm:text-sm font-bold">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-sm sm:text-xs text-muted-foreground mt-1.5 font-medium">
                              PDF (MAX. 10MB)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-10 text-base sm:text-sm font-semibold w-full sm:w-auto"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                disabled={isPending || !selectedFile}
                type="submit"
                className="h-11 sm:h-10 text-base sm:text-sm font-bold w-full sm:w-auto min-w-[140px]"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Confirm Upload"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
