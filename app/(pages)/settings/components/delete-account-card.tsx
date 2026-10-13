"use client";

import { useState, useTransition } from "react";
import { useClerk } from "@clerk/nextjs";
import { Loader2, Trash2 } from "lucide-react";
import { deleteAccount } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DataCounts } from "./export-data-card";
import { pluralize } from "./pluralize";

const CONFIRMATION_TEXT = "DELETE";
const AFTER_DELETE_URL = "/applications";

export function DeleteAccountCard({
  signedIn,
  counts,
}: {
  signedIn: boolean;
  counts: DataCounts;
}) {
  const clerk = useClerk();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const subject = signedIn ? "account" : "guest data";
  const confirmed = confirmation === CONFIRMATION_TEXT;

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    setOpen(next);
    if (!next) {
      setConfirmation("");
      setError(null);
    }
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(confirmation);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.signedIn) {
        try {
          await clerk.signOut({ redirectUrl: AFTER_DELETE_URL });
          return;
        } catch (signOutError) {
          // The Clerk user no longer exists, so its session is already gone.
          console.warn("Sign-out after account deletion failed:", signOutError);
        }
      }
      // Full reload so the proxy starts a fresh guest session.
      window.location.assign(AFTER_DELETE_URL);
    });
  };

  return (
    <Card className="gap-4 rounded-xl border-destructive/30 p-5">
      <CardHeader>
        <CardTitle className="text-base">
          {signedIn ? "Delete account" : "Delete guest data"}
        </CardTitle>
        <CardDescription>
          {signedIn
            ? "Permanently delete your account and everything in it. This can't be undone."
            : "Permanently delete everything saved in this browser's guest workspace. This can't be undone."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 />
              {signedIn ? "Delete account" : "Delete guest data"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete your {subject}?</DialogTitle>
              <DialogDescription>
                This permanently deletes{" "}
                {pluralize(counts.applications, "application")} with their
                status history and {pluralize(counts.documents, "document")}{" "}
                including the uploaded files
                {signedIn ? ", then closes your account" : ""}. You can&apos;t
                undo this. Export your data first if you want a copy.
              </DialogDescription>
            </DialogHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (confirmed && !isPending) handleDelete();
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="delete-confirmation">
                  Type <span className="font-mono font-semibold">{CONFIRMATION_TEXT}</span> to
                  confirm
                </Label>
                <Input
                  id="delete-confirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={isPending}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "delete-error" : undefined}
                />
                {error && (
                  <p id="delete-error" role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isPending}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={!confirmed || isPending}
                >
                  {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  {isPending ? "Deleting…" : `Delete ${subject}`}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
