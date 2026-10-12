import { AtsAnalysisResult } from "@/app/actions/ats";

export function generateMockAtsAnalysis(
  resumeText: string,
  jobDescription: string,
): AtsAnalysisResult {
  const jdLower = (jobDescription || "").toLowerCase();
  const resumeLower = (resumeText || "").toLowerCase();

  // Known skill dictionaries for realistic match computation
  const skillBank = [
    { name: "TypeScript", category: "hard_skill" as const },
    { name: "React 19", category: "hard_skill" as const },
    { name: "Next.js", category: "hard_skill" as const },
    { name: "Node.js", category: "hard_skill" as const },
    { name: "GraphQL", category: "hard_skill" as const },
    { name: "PostgreSQL", category: "hard_skill" as const },
    { name: "Tailwind CSS", category: "tool" as const },
    { name: "Docker", category: "tool" as const },
    { name: "Kubernetes", category: "tool" as const },
    { name: "AWS", category: "domain" as const },
    { name: "CI/CD", category: "domain" as const },
    { name: "System Design", category: "domain" as const },
    { name: "Cross-functional Collaboration", category: "soft_skill" as const },
    { name: "Technical Mentorship", category: "soft_skill" as const },
    { name: "Agile / Scrum", category: "soft_skill" as const },
  ];

  const matchedKeywords: AtsAnalysisResult["keywordAnalysis"]["matchedKeywords"] = [];
  const missingKeywords: AtsAnalysisResult["keywordAnalysis"]["missingKeywords"] = [];

  for (const item of skillBank) {
    const isDemandedInJd = jdLower.includes(item.name.toLowerCase());
    const isPresentInResume = resumeLower.includes(item.name.toLowerCase());

    if (isPresentInResume) {
      matchedKeywords.push({
        keyword: item.name,
        category: item.category,
        contextFound: `Verified match in candidate technical background & production experience.`,
      });
    } else if (isDemandedInJd) {
      missingKeywords.push({
        keyword: item.name,
        category: item.category,
        importance: missingKeywords.length === 0 ? "critical" : "recommended",
        placementAdvice: `Incorporate '${item.name}' under technical skills and quantify usage in a recent experience bullet.`,
      });
    }
  }

  // Ensure reasonable baseline if inputs are short or synthetic
  if (matchedKeywords.length === 0) {
    matchedKeywords.push(
      { keyword: "TypeScript", category: "hard_skill", contextFound: "Listed under core programming languages." },
      { keyword: "React", category: "hard_skill", contextFound: "Used across frontend application projects." },
      { keyword: "System Architecture", category: "domain", contextFound: "Demonstrated in service engineering." },
      { keyword: "Git & GitHub", category: "tool", contextFound: "Version control and collaborative PR reviews." },
    );
  }

  if (missingKeywords.length === 0) {
    missingKeywords.push(
      {
        keyword: "Turbopack / Webpack Bundling",
        category: "tool",
        importance: "recommended",
        placementAdvice: "Highlight build optimization metrics (e.g. bundle size reduction or build acceleration).",
      },
      {
        keyword: "Distributed Tracing (OpenTelemetry)",
        category: "domain",
        importance: "optional",
        placementAdvice: "Mention monitoring and observability tooling in experience bullets.",
      },
    );
  }

  const matchRatio = matchedKeywords.length / (matchedKeywords.length + missingKeywords.length);
  const overallScore = Math.min(95, Math.max(55, Math.round(matchRatio * 85 + 15)));

  const matchGrade: AtsAnalysisResult["matchGrade"] =
    overallScore >= 85
      ? "Exceptional"
      : overallScore >= 70
        ? "Strong"
        : overallScore >= 50
          ? "Moderate"
          : "Low";

  return {
    overallScore,
    matchGrade,
    executiveSummary:
      `Candidate profile demonstrates a ${matchGrade.toLowerCase()} technical alignment with the target role. ` +
      `Core strengths include strong modern web foundations, robust framework mastery, and clean component architecture. ` +
      `Addressing the top missing keywords and adding quantified impact metrics to older bullets will elevate pass rates through enterprise ATS parsers.`,
    dimensions: {
      hardSkillsScore: Math.min(100, overallScore + 4),
      experienceScore: Math.max(50, overallScore - 6),
      softSkillsScore: Math.min(95, overallScore + 2),
      formatScore: 92,
    },
    keywordAnalysis: {
      matchedKeywords,
      missingKeywords,
    },
    formattingWarnings: [
      {
        severity: "good",
        title: "Standard Section Headings",
        description: "Experience, Education, and Skills headers conform to major ATS parsing taxonomies.",
      },
      {
        severity: "good",
        title: "Clean Chronological Flow",
        description: "Employment dates and roles are formatted cleanly without overlapping gaps.",
      },
      {
        severity: "caution",
        title: "Metric Density",
        description: "Some bullet points lack quantified business outcomes (latency, conversion, cost, or scale).",
      },
    ],
    bulletOptimizations: [
      {
        originalBullet: "Responsible for improving page performance and fixing bugs across the web platform.",
        improvedBullet:
          "Engineered frontend performance optimizations across the web platform, cutting p99 page load times by 42% and eliminating 18 hydration regressions.",
        reasoning:
          "Replaces passive phrasing ('responsible for') with an active technical verb, adds concrete metrics (42%, 18 bugs), and specifies exact technical scope.",
        addedKeywords: ["Performance Optimization", "Hydration", "p99 Latency"],
      },
      {
        originalBullet: "Worked with design team to build reusable UI components in React.",
        improvedBullet:
          "Architected 35+ accessible, WCAG-compliant design system primitives in React and TypeScript, accelerating sprint feature velocity by 30%.",
        reasoning:
          "Grounds collaboration in measurable engineering deliverables (35+ primitives, 30% velocity gain) and highlights accessibility standards.",
        addedKeywords: ["Design Systems", "Accessibility (WCAG)", "TypeScript"],
      },
    ],
  };
}
