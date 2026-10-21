/**
 * Market context for the page. Dated so it is easy to see when it needs a
 * refresh; figures vary by source and role, so the page shows a range.
 */
export const INTERVIEW_RATE_BENCHMARK = {
  low: 0.02,
  high: 0.05,
  asOf: "2026",
  source: "Huntr job board research and HeroHunt funnel benchmarks",
} as const;
