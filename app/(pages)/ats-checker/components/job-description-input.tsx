"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Briefcase, Eraser, Sparkles } from "lucide-react";

interface JobDescriptionInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

const SAMPLE_JOB_DESCRIPTION = `Senior Fullstack Software Engineer

About the Role:
We are seeking an experienced Senior Fullstack Engineer to lead frontend architecture and distributed backend microservices. You will architect high-scale web applications, optimize API latency, and mentor engineering team members.

Key Responsibilities:
- Design, build, and deploy production-grade fullstack web applications using React, Next.js, TypeScript, and Node.js.
- Architect high-throughput REST and GraphQL APIs backed by PostgreSQL and Redis.
- Scale cloud infrastructure on AWS (Lambda, ECS, S3, CloudFront) with automated CI/CD pipelines.
- Partner with product managers, UX designers, and stakeholders to deliver customer-centric features with measurable business impact.
- Drive code quality, unit/integration testing (Jest, Playwright), and technical documentation.

Requirements:
- 5+ years of software engineering experience building modern web applications.
- Strong mastery of TypeScript, React 18/19, Next.js App Router, and Tailwind CSS.
- Deep experience with relational databases (PostgreSQL, Drizzle/Prisma) and query optimization.
- Hands-on experience with cloud infrastructure (AWS/GCP), Docker, and automated deployment pipelines.
- Excellent communication and cross-functional leadership skills.`;

export function JobDescriptionInput({
  value,
  onChange,
  disabled = false,
}: JobDescriptionInputProps) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  const handleLoadSample = () => {
    if (disabled) return;
    onChange(SAMPLE_JOB_DESCRIPTION);
  };

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">
                2. Target Job Description
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Paste the job posting requirements or try a sample
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5">
            {!value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={handleLoadSample}
                className="h-7 text-xs font-semibold gap-1 text-primary hover:bg-primary/10 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Try Sample JD</span>
              </Button>
            )}

            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onChange("")}
                className="h-7 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-between min-h-[220px]">
        <Textarea
          disabled={disabled}
          placeholder="Paste the job description here (e.g. About the Role, Minimum Qualifications, Preferred Skills, Responsibilities)..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[160px] text-xs resize-y flex-1"
        />

        <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-2">
          <span>
            {wordCount >= 50 ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                ✓ Good length for ATS keyword analysis
              </span>
            ) : (
              <span>Recommended: at least 50–100 words</span>
            )}
          </span>
          <span className="font-medium">
            {wordCount} {wordCount === 1 ? "word" : "words"} • {charCount} chars
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
