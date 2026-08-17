"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Check, Lightbulb } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BulletOptimization {
  originalBullet: string;
  improvedBullet: string;
  reasoning: string;
  addedKeywords: string[];
}

interface BulletOptimizerCardProps {
  optimizations: BulletOptimization[];
}

export function BulletOptimizerCard({
  optimizations,
}: BulletOptimizerCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({
      title: "Copied to clipboard",
      description: "Optimized bullet point copied successfully.",
    });
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  if (optimizations.length === 0) return null;

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">
            AI Bullet Point Optimizer
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Actionable before & after rewrites incorporating target JD keywords and quantifiable impact
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {optimizations.map((item, idx) => (
          <div
            key={`bullet-${idx}`}
            className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Original Bullet */}
              <div className="p-3 rounded-lg bg-background border border-border/40 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Original Bullet
                  </span>
                  <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                    "{item.originalBullet}"
                  </p>
                </div>
              </div>

              {/* Improved Bullet */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex flex-col justify-between relative">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Optimized Bullet (High-Impact Format)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Copy optimized bullet point ${idx + 1}`}
                      onClick={() => handleCopy(item.improvedBullet, idx)}
                      className="h-6 text-[11px] px-2 gap-1 font-semibold text-primary hover:bg-primary/10 cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs font-semibold text-foreground mt-1 leading-relaxed">
                    "{item.improvedBullet}"
                  </p>
                </div>

                {item.addedKeywords && item.addedKeywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-2.5 pt-2 border-t border-border/20">
                    <span className="text-[10px] text-muted-foreground font-medium mr-1">
                      Added Keywords:
                    </span>
                    {item.addedKeywords.map((kw, kIdx) => (
                      <Badge
                        key={`kw-${kIdx}`}
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold px-1.5 py-0"
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Reasoning Note */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/20">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold text-foreground">Why this works:</strong>{" "}
                {item.reasoning}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
