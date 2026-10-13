import { describe, expect, it } from "vitest";
import { groundBulletOptimizations } from "../ats-grounding";

const resumeText = `
Software Engineer, DataCo
- Wrote Python data pipelines and maintained CI on GitHub Actions
- Built internal admin pages in React with plain CSS
SKILLS: Python, React, PostgreSQL, GitHub Actions
`;

const missingKeywords = [
  "Playwright",
  "AWS (CloudFront, S3, Lambda)",
  "Next.js",
  "Tailwind CSS",
];

describe("groundBulletOptimizations", () => {
  it("drops a rewrite that claims tools missing from the resume", () => {
    const result = groundBulletOptimizations(
      [
        {
          originalBullet: "Wrote Python data pipelines and maintained CI on GitHub Actions",
          improvedBullet:
            "Automated Playwright E2E suites in GitHub Actions and deployed to AWS CloudFront",
          reasoning: "",
          addedKeywords: ["Playwright", "AWS"],
        },
      ],
      missingKeywords,
      resumeText,
    );

    expect(result.bulletOptimizations).toEqual([]);
    expect(result.dropped[0].unsupportedTerms).toEqual(
      expect.arrayContaining(["Playwright", "CloudFront"]),
    );
  });

  it("keeps a rephrasing that only surfaces what the resume says", () => {
    const bullet = {
      originalBullet: "Built internal admin pages in React with plain CSS",
      improvedBullet: "Built internal admin pages in React backed by PostgreSQL reports",
      reasoning: "",
      addedKeywords: ["React", "PostgreSQL"],
    };

    const result = groundBulletOptimizations([bullet], missingKeywords, resumeText);

    expect(result.dropped).toEqual([]);
    expect(result.bulletOptimizations).toEqual([bullet]);
  });

  it("strips addedKeywords the resume does not contain but keeps the rewrite", () => {
    const result = groundBulletOptimizations(
      [
        {
          originalBullet: "Reviewed pull requests and onboarded two junior developers",
          improvedBullet: "Mentored two junior developers and reviewed their pull requests",
          reasoning: "",
          addedKeywords: ["Mentoring", "pull requests"],
        },
      ],
      missingKeywords,
      resumeText + "\n- Reviewed pull requests",
    );

    expect(result.dropped).toEqual([]);
    expect(result.bulletOptimizations[0].addedKeywords).toEqual(["pull requests"]);
  });

  it("keeps a missing keyword the resume actually contains", () => {
    const result = groundBulletOptimizations(
      [
        {
          originalBullet: "Maintained CI on GitHub Actions",
          improvedBullet: "Maintained GitHub Actions CI that runs the Playwright suite",
          reasoning: "",
          addedKeywords: ["Playwright"],
        },
      ],
      missingKeywords,
      resumeText + "\n- Wrote Playwright smoke tests",
    );

    expect(result.dropped).toEqual([]);
    expect(result.bulletOptimizations[0].addedKeywords).toEqual(["Playwright"]);
  });

  it("matches terms on word boundaries", () => {
    const result = groundBulletOptimizations(
      [
        {
          originalBullet: "Maintained CI pipelines",
          improvedBullet: "Maintained CI pipelines for the Lambda-free monolith",
          reasoning: "",
          addedKeywords: [],
        },
        {
          originalBullet: "Wrote reports",
          improvedBullet: "Wrote S3-backed reports",
          reasoning: "",
          addedKeywords: [],
        },
      ],
      ["S", "Lambda"],
    );

    // "Lambda" is named in the first rewrite; the single letter "S" is not
    // matched inside "S3".
    expect(result.dropped.map((d) => d.unsupportedTerms)).toEqual([["Lambda"]]);
    expect(result.bulletOptimizations).toHaveLength(1);
  });

  it("drops a rewrite that invents metrics", () => {
    const result = groundBulletOptimizations(
      [
        {
          originalBullet: "Wrote Python data pipelines and maintained CI on GitHub Actions",
          improvedBullet:
            "Built Python data pipelines processing 500GB daily and cut CI build times by 15%",
          reasoning: "",
          addedKeywords: [],
        },
      ],
      missingKeywords,
      resumeText,
    );

    expect(result.dropped[0].unsupportedTerms).toEqual(["500", "15"]);
  });

  it("allows numbers from the resume, number words and placeholders", () => {
    const bullet = {
      originalBullet: "Reviewed pull requests and onboarded two junior developers",
      improvedBullet:
        "Onboarded 2 junior developers since 2022, cutting ramp-up time by [X%] with S3-hosted E2E docs",
      reasoning: "",
      addedKeywords: [],
    };

    const result = groundBulletOptimizations([bullet], [], "DataCo (03/2022 - Present)");

    expect(result.dropped).toEqual([]);
  });

  describe("without resume text (file uploads)", () => {
    it("drops rewrites that name the model's own missing keywords", () => {
      const result = groundBulletOptimizations(
        [
          {
            originalBullet: "Built internal admin pages in React",
            improvedBullet: "Built admin pages in Next.js and Tailwind CSS",
            reasoning: "",
            addedKeywords: ["Next.js"],
          },
        ],
        missingKeywords,
      );

      expect(result.bulletOptimizations).toEqual([]);
      expect(result.dropped[0].unsupportedTerms).toEqual(
        expect.arrayContaining(["Next.js", "Tailwind CSS"]),
      );
    });

    it("keeps rewrites it cannot disprove, minus missing keywords", () => {
      const result = groundBulletOptimizations(
        [
          {
            originalBullet: "Built internal admin pages in React",
            improvedBullet: "Built internal admin pages in React and TypeScript",
            reasoning: "",
            addedKeywords: ["TypeScript", "Playwright"],
          },
        ],
        missingKeywords,
      );

      expect(result.dropped).toEqual([]);
      expect(result.bulletOptimizations[0].addedKeywords).toEqual(["TypeScript"]);
    });
  });
});
