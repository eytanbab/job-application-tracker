"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";

interface NudgeItem {
  id: string;
  company: string;
  role: string;
  daysAgo: number;
  dateApplied: string;
}

interface NudgeModalProps {
  item: NudgeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NudgeModal({ item, open, onOpenChange }: NudgeModalProps) {
  const [channel, setChannel] = useState<"email" | "linkedin">("email");
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const emailSubject = `Following Up — ${item.role} Application`;
  const emailBody = `Hi [Recruiter / Hiring Manager Name],

I hope you are having a productive week.

I am following up on my application for the ${item.role} position at ${item.company}, submitted on ${item.dateApplied}. I remain very enthusiastic about the work your team is doing and would welcome the opportunity to discuss how my background aligns with your current priorities.

Please let me know if you need any additional work samples or background information from my end.

Thank you for your time and consideration.

Best regards,
[Your Name]`;

  const linkedinBody = `Hi [Name], I recently applied for the ${item.role} role at ${item.company}. Given my background in this domain, I would welcome the opportunity to connect and briefly discuss how I could contribute to your team's objectives. Thank you for your time!`;

  const textToCopy = channel === "email" ? `${emailSubject}\n\n${emailBody}` : linkedinBody;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[calc(100vw-2rem)] sm:w-full p-4 sm:p-6 bg-card border border-border/40 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base font-bold text-foreground">
              Follow-Up Template — {item.company}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {item.role} · Applied {item.daysAgo} {item.daysAgo === 1 ? "day" : "days"} ago ({item.dateApplied})
          </DialogDescription>
        </DialogHeader>

        {/* Channel Selection */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/30 w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setChannel("email")}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              channel === "email"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </button>
          <button
            type="button"
            onClick={() => setChannel("linkedin")}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              channel === "linkedin"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            LinkedIn Note
          </button>
        </div>

        {/* Template Container */}
        <div className="space-y-2">
          {channel === "email" && (
            <div className="p-2.5 rounded-lg bg-background border border-border/40 text-xs">
              <span className="text-muted-foreground font-medium">Subject: </span>
              <span className="font-semibold text-foreground">{emailSubject}</span>
            </div>
          )}

          <div className="p-3.5 rounded-lg bg-background border border-border/40 text-xs text-foreground/90 font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
            {channel === "email" ? emailBody : linkedinBody}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5 cursor-pointer">
            <Link href={`/applications?q=${encodeURIComponent(item.company)}`}>
              Open in Tracker
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>

          <Button
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 text-xs font-semibold cursor-pointer min-w-[110px]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Template
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
