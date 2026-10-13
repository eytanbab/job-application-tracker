import type { AtsAnalysisResult } from "@/app/actions/ats";

type BulletOptimization = AtsAnalysisResult["bulletOptimizations"][number];

export interface UngroundedBullet {
  originalBullet: string;
  improvedBullet: string;
  unsupportedTerms: string[];
}

export interface GroundedBullets {
  bulletOptimizations: BulletOptimization[];
  dropped: UngroundedBullet[];
}

/** Lowercases and pads text so terms can be matched on word boundaries. */
function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim()} `;
}

function mentions(normalizedText: string, term: string): boolean {
  const normalizedTerm = normalize(term).trim();
  return normalizedTerm.length > 0 && normalizedText.includes(` ${normalizedTerm} `);
}

/**
 * Splits compound keywords such as "AWS (CloudFront, S3, Lambda)" so a
 * rewrite that names only "CloudFront" is still caught.
 */
function expandTerm(term: string): string[] {
  const parts = term
    .split(/[(),;]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return [term, ...parts];
}

// "one" is left out: it is too common as a pronoun ("one of the").
const NUMBER_WORDS: Record<string, string> = {
  two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
};

/**
 * Numbers written as digits, plus small numbers written as words. Digits
 * glued to a preceding letter ("S3", "E2E", "p99") are names, not metrics.
 */
function numbersIn(text: string): Set<string> {
  const digits = (text.match(/(?<![A-Za-z\d.,])\d+(?:[.,]\d+)*/g) ?? []).map((n) =>
    n.replace(/,/g, ""),
  );
  const words = normalize(text)
    .split(" ")
    .flatMap((word) => (word in NUMBER_WORDS ? [NUMBER_WORDS[word]] : []));
  return new Set([...digits, ...words]);
}

/**
 * Drops bullet rewrites that claim missing JD keywords or invent numbers, and
 * trims addedKeywords to the ones the resume backs up.
 *
 * A rewrite is dropped when it names one of the model's missingKeywords that
 * neither the original bullet nor the resume text contains, or states a
 * number found in neither. Without resume text (PDF uploads), the gap
 * analysis is taken at its word and numbers must come from the original
 * bullet.
 */
export function groundBulletOptimizations(
  bullets: BulletOptimization[],
  missingKeywords: string[],
  resumeText?: string,
): GroundedBullets {
  const resume = resumeText ? normalize(resumeText) : null;
  const missingTerms = missingKeywords.flatMap(expandTerm);
  const missingSet = new Set(missingTerms.map((term) => normalize(term)));
  const resumeNumbers = resumeText ? numbersIn(resumeText) : new Set<string>();

  const kept: BulletOptimization[] = [];
  const dropped: UngroundedBullet[] = [];

  for (const bullet of bullets) {
    const original = normalize(bullet.originalBullet);
    const improved = normalize(bullet.improvedBullet);
    const addedKeywords = bullet.addedKeywords ?? [];

    const isSupported = (term: string) =>
      mentions(original, term) || (resume !== null && mentions(resume, term));
    const isKnownMissing = (term: string) =>
      expandTerm(term).some((part) => missingSet.has(normalize(part)));

    const originalNumbers = numbersIn(bullet.originalBullet);
    const inventedNumbers = [...numbersIn(bullet.improvedBullet)].filter(
      (n) => !originalNumbers.has(n) && !resumeNumbers.has(n),
    );

    const unsupportedTerms = [
      ...new Set([
        ...missingTerms.filter((term) => mentions(improved, term) && !isSupported(term)),
        ...inventedNumbers,
      ]),
    ];

    if (unsupportedTerms.length > 0) {
      dropped.push({
        originalBullet: bullet.originalBullet,
        improvedBullet: bullet.improvedBullet,
        unsupportedTerms,
      });
      continue;
    }

    kept.push({
      ...bullet,
      addedKeywords: addedKeywords.filter((keyword) =>
        resume !== null ? isSupported(keyword) : !isKnownMissing(keyword),
      ),
    });
  }

  return { bulletOptimizations: kept, dropped };
}
