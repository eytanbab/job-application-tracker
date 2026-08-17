import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FileText, Users, Activity, Clock, HelpCircle } from "lucide-react";
import Link from "next/link";

type Props = {
  totalApplications: number;
  activeCount: number;
  activeStages: {
    applied: number;
    review: number;
    interview: number;
  };
  interviewRate: number;
  interviewConversionRate: number;
  averageResponseDays: number | null;
};

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export function KpiSummary({
  activeCount,
  activeStages,
  interviewRate,
  interviewConversionRate,
  averageResponseDays,
}: Props) {
  return (
    <div className="col-span-full grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Active Pipeline */}
      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Pipeline
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Active pipeline calculation info"
                  className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-xs p-3 space-y-1.5 z-50">
                <p className="font-semibold text-foreground">Definition</p>
                <p className="text-muted-foreground">
                  Applications currently in flight across Applied, In Review, and Interview stages.
                </p>
                <p className="font-semibold text-foreground pt-1">Target Pace</p>
                <p className="text-emerald-700 dark:text-emerald-400 font-medium">10 – 20 concurrent active applications</p>
              </PopoverContent>
            </Popover>
          </div>
          <Activity className="h-4 w-4 text-primary/70" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-foreground">
              {activeCount}
            </p>
            <Link
              href="/applications"
              className="text-xs text-primary font-medium hover:underline ml-auto cursor-pointer"
            >
              View pipeline →
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {activeCount > 0
              ? `${activeStages.applied} applied • ${activeStages.review} review • ${activeStages.interview} interview`
              : "No active applications in flight"}
          </p>
        </CardContent>
      </Card>

      {/* 2. Resume Pass Rate */}
      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resume Pass Rate
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Resume pass rate calculation info"
                  className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-xs p-3 space-y-1.5 z-50">
                <p className="font-semibold text-foreground">Formula</p>
                <p className="text-muted-foreground">
                  (Applications Reaching Interview Stage) ÷ (Total Applications)
                </p>
                <p className="font-semibold text-foreground pt-1">Target Benchmark</p>
                <p className="text-emerald-700 dark:text-emerald-400 font-medium">15.0% – 25.0% typical pass rate</p>
              </PopoverContent>
            </Popover>
          </div>
          <FileText className="h-4 w-4 text-muted-foreground/70" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-extrabold text-foreground">
            {formatPercent(interviewRate)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Applications reaching interview stage
          </p>
        </CardContent>
      </Card>

      {/* 3. Interview Conversion */}
      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interview Conversion
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Interview conversion calculation info"
                  className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-xs p-3 space-y-1.5 z-50">
                <p className="font-semibold text-foreground">Formula</p>
                <p className="text-muted-foreground">
                  (Accepted Offers) ÷ (Total Interviewed Applications)
                </p>
                <p className="font-semibold text-foreground pt-1">Target Benchmark</p>
                <p className="text-emerald-700 dark:text-emerald-400 font-medium">20.0% – 35.0% conversion rate</p>
              </PopoverContent>
            </Popover>
          </div>
          <Users className="h-4 w-4 text-muted-foreground/70" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-extrabold text-foreground">
            {formatPercent(interviewConversionRate)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Interviews converted to accepted offers
          </p>
        </CardContent>
      </Card>

      {/* 4. Response Velocity */}
      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Response Velocity
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Response velocity calculation info"
                  className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-xs p-3 space-y-1.5 z-50">
                <p className="font-semibold text-foreground">Formula</p>
                <p className="text-muted-foreground">
                  Average days elapsed between application submission & recruiter status update
                </p>
                <p className="font-semibold text-foreground pt-1">Target Response Time</p>
                <p className="text-blue-700 dark:text-blue-400 font-medium">7 – 14 calendar days</p>
              </PopoverContent>
            </Popover>
          </div>
          <Clock className="h-4 w-4 text-muted-foreground/70" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-extrabold text-foreground">
            {averageResponseDays !== null
              ? `${averageResponseDays} ${averageResponseDays === 1 ? "Day" : "Days"}`
              : "N/A"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {averageResponseDays !== null
              ? "Average time to recruiter response"
              : "Requires status updates to calculate"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
