"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Code2, Briefcase, Users, LayoutTemplate, HelpCircle } from "lucide-react";

interface AtsDimensionBreakdownProps {
  dimensions: {
    hardSkillsScore: number;
    experienceScore: number;
    softSkillsScore: number;
    formatScore: number;
  };
}

export function AtsDimensionBreakdown({
  dimensions,
}: AtsDimensionBreakdownProps) {
  const getScoreTier = (score: number) => {
    if (score >= 75) {
      return {
        label: "Strong",
        barColor: "bg-emerald-500",
        textColor: "text-emerald-700 dark:text-emerald-400",
      };
    }
    if (score >= 50) {
      return {
        label: "Moderate",
        barColor: "bg-amber-500",
        textColor: "text-amber-700 dark:text-amber-400",
      };
    }
    return {
      label: "Needs Work",
      barColor: "bg-rose-500",
      textColor: "text-rose-700 dark:text-rose-400",
    };
  };

  const categories = [
    {
      title: "Hard Skills & Tech Stack",
      score: dimensions.hardSkillsScore,
      icon: Code2,
      description:
        "Programming languages, frameworks, cloud platforms, and developer tools match",
      benchmark: "Target: ≥ 75%",
      benchmarkClass: "text-emerald-700 dark:text-emerald-400",
    },
    {
      title: "Experience & Seniority",
      score: dimensions.experienceScore,
      icon: Briefcase,
      description:
        "Years of experience, job title hierarchy, domain depth, and leadership scope",
      benchmark: "Target: ≥ 70%",
      benchmarkClass: "text-emerald-700 dark:text-emerald-400",
    },
    {
      title: "Soft Skills & Leadership",
      score: dimensions.softSkillsScore,
      icon: Users,
      description:
        "Collaboration, communication, stakeholder management, and agile execution",
      benchmark: "Target: ≥ 65%",
      benchmarkClass: "text-emerald-700 dark:text-emerald-400",
    },
    {
      title: "ATS Formatting & Structure",
      score: dimensions.formatScore,
      icon: LayoutTemplate,
      description:
        "Clean typography, standard section titles, parsing clarity, and contact info detection",
      benchmark: "Target: ≥ 90%",
      benchmarkClass: "text-emerald-700 dark:text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const tier = getScoreTier(cat.score);

        return (
          <Card
            key={cat.title}
            className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow flex flex-col justify-between"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-start gap-1.5 min-w-0 flex-1">
                  <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
                    {cat.title}
                  </CardTitle>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${cat.title} information`}
                      className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 text-xs p-3 space-y-1.5 z-50">
                    <p className="font-semibold text-foreground">{cat.title}</p>
                    <p className="text-muted-foreground">{cat.description}</p>
                    <p className="font-semibold text-foreground pt-1">Benchmark</p>
                    <p className={`${cat.benchmarkClass} font-medium`}>
                      {cat.benchmark}
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-foreground">
                  {cat.score}%
                </span>
                <span className={`text-[11px] font-bold ${tier.textColor}`}>
                  {tier.label}
                </span>
              </div>

              {/* Dynamic Score Tier Progress Bar */}
              <div
                className="h-2 w-full rounded-full bg-muted/60 overflow-hidden"
                role="progressbar"
                aria-valuenow={cat.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${cat.title} score: ${cat.score}%`}
              >
                <div
                  className={`h-full rounded-full ${tier.barColor} transition-[width] duration-700`}
                  style={{ width: `${Math.min(100, Math.max(0, cat.score))}%` }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
