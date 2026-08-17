"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResumeInputSection } from "./resume-input-section";
import { JobDescriptionInput } from "./job-description-input";
import { AtsScoreCard } from "./ats-score-card";
import { AtsDimensionBreakdown } from "./ats-dimension-breakdown";
import { KeywordGapMatrix } from "./keyword-gap-matrix";
import { AtsFormattingChecklist } from "./ats-formatting-checklist";
import { BulletOptimizerCard } from "./bullet-optimizer-card";
import {
  analyzeResumeWithAts,
  type AtsAnalysisResult,
  type ResumeInputPayload,
} from "@/app/actions/ats";
import {
  Sparkles,
  Loader2,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Edit3,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type SavedDocument = {
  id: string;
  title: string;
  fileName: string;
  fileSize: string | null;
  category: string;
  createdAt: Date;
};

interface AtsCheckerClientProps {
  savedDocuments: SavedDocument[];
}

const LOADING_STEPS = [
  "Parsing resume entities & layout structure...",
  "Extracting target job description keywords...",
  "Running ATS filter & compatibility heuristics...",
  "Synthesizing high-impact bullet rewrites...",
];

export function AtsCheckerClient({ savedDocuments }: AtsCheckerClientProps) {
  const [resumeInput, setResumeInput] = useState<ResumeInputPayload>(
    savedDocuments.length > 0
      ? { type: "document", documentId: savedDocuments[0].id }
      : { type: "text", text: "" },
  );
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [result, setResult] = useState<AtsAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Progressive loading steps interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Validation logic
  const isResumeProvided =
    resumeInput.type === "document"
      ? Boolean(resumeInput.documentId)
      : resumeInput.type === "file"
        ? Boolean(resumeInput.base64)
        : Boolean(resumeInput.text.trim().length >= 50);

  const isJdValid = jobDescription.trim().length >= 30;
  const canSubmit = !isAnalyzing && isResumeProvided && isJdValid;

  const handleAnalyze = async () => {
    if (!canSubmit) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await analyzeResumeWithAts(resumeInput, jobDescription);
      if (res.success) {
        setResult(res.data);
        toast({
          title: "Analysis complete!",
          description: `Resume evaluated with an overall score of ${res.data.overallScore}/100.`,
        });
      } else {
        setError(res.error);
        toast({
          title: "Analysis failed",
          description: res.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to analyze resume.";
      setError(msg);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset entirely
  const handleFullReset = () => {
    setResult(null);
    setError(null);
    setJobDescription("");
    if (savedDocuments.length > 0) {
      setResumeInput({ type: "document", documentId: savedDocuments[0].id });
    } else {
      setResumeInput({ type: "text", text: "" });
    }
  };

  // Edit inputs while preserving state
  const handleEditInputs = () => {
    setResult(null);
    setError(null);
  };

  // Copy full summary to clipboard
  const handleCopyFullReport = () => {
    if (!result) return;

    const matchedList = result.keywordAnalysis.matchedKeywords
      .map((k) => `• ${k.keyword}`)
      .join("\n");
    const missingList = result.keywordAnalysis.missingKeywords
      .map((k) => `• ${k.keyword} (${k.importance}): ${k.placementAdvice}`)
      .join("\n");
    const checklist = result.formattingWarnings
      .map((w) => `[${w.severity.toUpperCase()}] ${w.title}: ${w.description}`)
      .join("\n");

    const reportText = `ATS COMPATIBILITY REPORT
========================
Overall Match Score: ${result.overallScore}/100 (${result.matchGrade} Match)

Executive Summary:
${result.executiveSummary}

Dimension Breakdown:
- Hard Skills & Tech Stack: ${result.dimensions.hardSkillsScore}%
- Experience & Seniority: ${result.dimensions.experienceScore}%
- Soft Skills & Leadership: ${result.dimensions.softSkillsScore}%
- ATS Formatting: ${result.dimensions.formatScore}%

Matched Keywords:
${matchedList || "None"}

Missing Target Keywords:
${missingList || "None"}

ATS Formatting Checks:
${checklist}
`;

    navigator.clipboard.writeText(reportText);
    setCopiedSummary(true);
    toast({
      title: "Summary copied to clipboard",
      description: "Full diagnostic report copied successfully.",
    });
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full opacity-100 transition-opacity duration-500">
      {/* If No Result: Show Dual Input Mode */}
      {!result ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResumeInputSection
              savedDocuments={savedDocuments}
              value={resumeInput}
              onChange={setResumeInput}
              disabled={isAnalyzing}
            />

            <JobDescriptionInput
              value={jobDescription}
              onChange={setJobDescription}
              disabled={isAnalyzing}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center gap-3 text-destructive text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Trigger & Readiness Indicators */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-border/30">
            {/* Real-time Requirement Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Readiness:
              </span>
              <Badge
                variant="outline"
                className={
                  isResumeProvided
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1"
                    : "bg-muted text-muted-foreground border-border/40 gap-1"
                }
              >
                {isResumeProvided ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                )}
                <span>1. Resume Provided</span>
              </Badge>

              <Badge
                variant="outline"
                className={
                  isJdValid
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1"
                    : "bg-muted text-muted-foreground border-border/40 gap-1"
                }
              >
                {isJdValid ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                )}
                <span>
                  2. Job Description{" "}
                  {jobDescription.trim().length < 30
                    ? `(needs ${Math.max(0, 30 - jobDescription.trim().length)} more chars)`
                    : "✓"}
                </span>
              </Badge>
            </div>

            {/* Submit Button with Progressive Multi-Stage Text */}
            <Button
              size="lg"
              disabled={!canSubmit || isAnalyzing}
              onClick={handleAnalyze}
              className="w-full sm:w-auto gap-2 font-bold text-sm px-6 h-11 shadow-sm cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="truncate max-w-[280px]">
                    {LOADING_STEPS[loadingStepIndex]}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run ATS Compatibility Scan</span>
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                ATS Compatibility Report
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyFullReport}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Full Report</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleEditInputs}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Inputs & Re-scan</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullReset}
                className="gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset All</span>
              </Button>
            </div>
          </div>

          {/* 1. Overall Score Card */}
          <AtsScoreCard
            score={result.overallScore}
            grade={result.matchGrade}
            executiveSummary={result.executiveSummary}
          />

          {/* 2. Four Dimension Sub-scores */}
          <AtsDimensionBreakdown dimensions={result.dimensions} />

          {/* 3. Matched vs Missing Keyword Gap Matrix */}
          <KeywordGapMatrix
            matchedKeywords={result.keywordAnalysis.matchedKeywords}
            missingKeywords={result.keywordAnalysis.missingKeywords}
          />

          {/* 4. ATS Formatting & Parseability Checklist */}
          <AtsFormattingChecklist warnings={result.formattingWarnings} />

          {/* 5. AI Bullet Point Optimizer */}
          <BulletOptimizerCard optimizations={result.bulletOptimizations} />
        </div>
      )}
    </div>
  );
}
