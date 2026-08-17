"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface KeywordGapMatrixProps {
  matchedKeywords: Array<{
    keyword: string;
    category: "hard_skill" | "soft_skill" | "tool" | "domain";
    contextFound?: string;
  }>;
  missingKeywords: Array<{
    keyword: string;
    category: "hard_skill" | "soft_skill" | "tool" | "domain";
    importance: "critical" | "recommended" | "optional";
    placementAdvice: string;
  }>;
}

export function KeywordGapMatrix({
  matchedKeywords,
  missingKeywords,
}: KeywordGapMatrixProps) {
  const [showAllAdvice, setShowAllAdvice] = useState(false);
  const adviceLimit = 4;
  const displayedAdvice = showAllAdvice
    ? missingKeywords
    : missingKeywords.slice(0, adviceLimit);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Matched Keywords Card */}
      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl flex flex-col justify-between">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Matched Keywords ({matchedKeywords.length})
              </CardTitle>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Found in your resume
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-4 flex-1">
          {matchedKeywords.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">
              No direct keyword matches detected.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {matchedKeywords.map((item, idx) => (
                <Badge
                  key={`${item.keyword}-${idx}`}
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 px-2.5 py-1 text-xs font-semibold gap-1.5"
                >
                  <Tag className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{item.keyword}</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Missing Critical Keywords Card */}
      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl flex flex-col justify-between">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Missing Keywords ({missingKeywords.length})
              </CardTitle>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Target keywords to incorporate
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-4 flex-1">
          {missingKeywords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-1" />
              <p className="text-xs text-foreground font-semibold">
                Outstanding coverage!
              </p>
              <p className="text-[11px] text-muted-foreground">
                All primary job description keywords are present in your resume.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {missingKeywords.map((item, idx) => (
                  <Badge
                    key={`${item.keyword}-${idx}`}
                    variant="outline"
                    className={
                      item.importance === "critical"
                        ? "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30 px-2.5 py-1 text-xs font-bold gap-1.5"
                        : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 px-2.5 py-1 text-xs font-semibold gap-1.5"
                    }
                  >
                    <KeyRound className="h-3 w-3 shrink-0" />
                    <span>{item.keyword}</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      ({item.importance})
                    </span>
                  </Badge>
                ))}
              </div>

              {/* Placement Advice List */}
              <div className="border-t border-border/30 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                    Placement Strategy ({missingKeywords.length} tips)
                  </p>
                  {missingKeywords.length > adviceLimit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllAdvice(!showAllAdvice)}
                      className="h-6 text-[11px] px-2 font-semibold text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                    >
                      <span>
                        {showAllAdvice
                          ? "Show less"
                          : `Show all (${missingKeywords.length})`}
                      </span>
                      {showAllAdvice ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {displayedAdvice.map((item, idx) => (
                    <div
                      key={`advice-${idx}`}
                      className="text-xs bg-muted/40 rounded-lg p-2 border border-border/30"
                    >
                      <strong className="font-semibold text-foreground">
                        {item.keyword}:
                      </strong>{" "}
                      <span className="text-muted-foreground">
                        {item.placementAdvice}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
