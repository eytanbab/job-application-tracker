"use server";

import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { getCurrentUserIdOrThrow } from "./_utils/user-context";
import { geminiAtsClient } from "@/lib/gemini";
import { s3Client } from "@/lib/s3-client";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export interface AtsAnalysisResult {
  overallScore: number;
  matchGrade: "Exceptional" | "Strong" | "Moderate" | "Low";
  executiveSummary: string;
  dimensions: {
    hardSkillsScore: number;
    experienceScore: number;
    softSkillsScore: number;
    formatScore: number;
  };
  keywordAnalysis: {
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
  };
  formattingWarnings: Array<{
    severity: "warning" | "caution" | "good";
    title: string;
    description: string;
  }>;
  bulletOptimizations: Array<{
    originalBullet: string;
    improvedBullet: string;
    reasoning: string;
    addedKeywords: string[];
  }>;
}

export type ResumeInputPayload =
  | { type: "text"; text: string }
  | { type: "file"; base64: string; mimeType: string; fileName: string }
  | { type: "document"; documentId: string };

export async function getSavedResumes() {
  const userId = await getCurrentUserIdOrThrow();

  const userDocuments = await db
    .select({
      id: documents.id,
      title: documents.title,
      fileName: documents.file_name,
      fileSize: documents.file_size,
      category: documents.category,
      createdAt: documents.created_at,
    })
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.created_at));

  return userDocuments;
}

export async function analyzeResumeWithAts(
  resumeInput: ResumeInputPayload,
  jobDescription: string,
): Promise<{ success: true; data: AtsAnalysisResult } | { success: false; error: string }> {
  try {
    if (!process.env.GEMINI_ATS_API_KEY && !process.env.GEMINI_API_KEY) {
      return {
        success: false,
        error:
          "GEMINI_ATS_API_KEY is not configured in your environment variables (.env). Please add a valid Gemini API key from Google AI Studio to run ATS scans.",
      };
    }

    const userId = await getCurrentUserIdOrThrow();

    if (!jobDescription || jobDescription.trim().length < 30) {
      return {
        success: false,
        error: "Please provide a valid job description with at least 30 characters.",
      };
    }

    const parts: any[] = [];

    // 1. Process Resume Input
    if (resumeInput.type === "text") {
      if (!resumeInput.text || resumeInput.text.trim().length < 50) {
        return {
          success: false,
          error: "Please provide valid resume text with at least 50 characters.",
        };
      }
      parts.push({
        text: `RESUME TEXT:\n${resumeInput.text.trim()}`,
      });
    } else if (resumeInput.type === "file") {
      if (!resumeInput.base64) {
        return {
          success: false,
          error: "No resume file payload provided.",
        };
      }
      parts.push({
        inlineData: {
          mimeType: resumeInput.mimeType || "application/pdf",
          data: resumeInput.base64,
        },
      });
    } else if (resumeInput.type === "document") {
      const doc = await db
        .select()
        .from(documents)
        .where(and(eq(documents.userId, userId), eq(documents.id, resumeInput.documentId)))
        .limit(1);

      if (!doc || doc.length === 0) {
        return {
          success: false,
          error: "Selected document not found in your library.",
        };
      }

      const fileKey = doc[0].file_key;
      const bucketName = process.env.NEXT_AWS_S3_BUCKET_NAME || "";

      if (!bucketName) {
        return {
          success: false,
          error: "S3 bucket configuration is missing.",
        };
      }

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      });

      const s3Response = await s3Client.send(getCommand);
      if (!s3Response.Body) {
        return {
          success: false,
          error: "Could not retrieve document stream from storage.",
        };
      }

      const byteArray = await s3Response.Body.transformToByteArray();
      const base64Data = Buffer.from(byteArray).toString("base64");

      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      });
    }

    // 2. Build Analysis Prompt with Strict Anti-AI 2026 Resume Standards
    const now = new Date();
    const currentDateStr = now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const currentYear = now.getFullYear();

    const prompt = `You are an elite Senior Staff Engineer, Engineering Director, and Technical Recruiter.
Analyze the candidate's Resume against the target Job Description with surgical precision, zero corporate fluff, and deep technical realism following modern resume engineering standards.

TODAY'S REFERENCE DATE: ${currentDateStr} (Current Year: ${currentYear})
CRITICAL TIMELINE & DATE RULES:
- The real current date is strictly ${currentDateStr}.
- Do NOT use internal training cutoffs (such as 2024 or 2025) to calculate experience durations or identify future dates.
- For calculating tenure on active jobs listed from a start date (e.g. 04/2023) to "Present", calculate elapsed time to ${currentYear} (e.g. April 2023 to August 2026 is 3 years and 4 months, NOT 1.5 years).
- Any education, degrees, or certifications dated ${currentYear} or earlier are valid, completed/current credentials, NOT "future-dated".
- Never refer to 2024 or 2025 as "current year" or "this year" in your analysis, executive summary, or bullet rewrites.

TARGET JOB DESCRIPTION:
${jobDescription.trim()}

CRITICAL TONE & STYLE DIRECTIVES (STRICT ANTI-AI RULES):
1. FORBIDDEN AI BUZZWORDS & JARGON:
   NEVER use generic LLM buzzwords, artificial adjectives, or synthetic corporate filler.
   BANNED WORDS: "Spearheaded", "Leveraged", "Harnessed", "Orchestrated", "Pioneered", "Championed", "Catalyzed", "Revolutionized", "Fostered", "Streamlined", "Maximized", "Synergized", "Facilitated", "Utilized", "Empowered", "Drove transformative results", "Testament to", "Delved", "Seamlessly", "Robust", "Holistic", "Dynamic", "Cutting-edge", "Game-changing", "State-of-the-art", "Passionate about", "Results-oriented", "Demonstrated proficiency", "Spearheading", "Leveraging".

2. APPROVED ACTION VERBS (CONCRETE & GROUNDED):
   Use direct, natural, and authentic technical verbs:
   - "Built", "Architected", "Engineered", "Designed", "Migrated", "Reduced", "Refactored", "Scaled", "Automated", "Deployed", "Cut", "Rewrote", "Tuned", "Instrumented", "Replaced", "Consolidated", "Maintained", "Shipped".

3. 2026 BULLET REWRITE STANDARD (HIGH SIGNAL-TO-NOISE):
   - Every bullet must follow the concise Impact Format: [Active Verb] + [Specific Technical Mechanism / Stack] + [Measurable Engineering Outcome or Scale].
   - Keep rewrites concise (1 to 2 lines max). Strip away empty modifiers ("highly scalable", "world-class", "innovative solutions"). Let the concrete tech stack and metrics prove the scale.
   - Embed target Job Description keywords naturally as tools used in context, NOT keyword-stuffed strings.
   - Use realistic metrics (e.g. latency in ms, throughput in req/s, CI build time in minutes, percentage cost/error reduction, data volume). If the original bullet lacked a metric, insert a realistic quantified benchmark (e.g. "cutting bundle size by 35%" or "reducing p99 latency to <120ms").

EVALUATION SPECIFICATIONS:
1. Overall Match Score: 0 to 100 based on realistic employer requirements. Grade as:
   - "Exceptional" (>= 85): Strong qualification alignment across stack, experience, and scope.
   - "Strong" (70-84): Meets primary requirements with minor keyword/tooling gaps.
   - "Moderate" (50-69): Partial alignment; missing several core requirements.
   - "Low" (< 50): Significant gap in tech stack or seniority.
2. Four Sub-Scores (0 to 100):
   - hardSkillsScore: Precise match of programming languages, frameworks, cloud systems, and technical tools.
   - experienceScore: Seniority alignment, years of experience, scope of impact, and relevant domain work.
   - softSkillsScore: Authentic team impact, cross-functional collaboration, mentoring, and execution velocity.
   - formatScore: Clean header hierarchy, standard section titles, ATS-friendly typography, absence of parsing hazards.
3. Keyword Gap Matrix:
   - matchedKeywords: 4-10 core skills/terms from the JD found in the resume.
   - missingKeywords: 4-10 critical or recommended keywords from the JD missing or weak in the resume, with specific placement advice.
4. ATS Formatting & Parsing Checklist:
   - 3-5 checks evaluating resume readability, structural headers, contact info presence, bullet formatting, and quantitative impact.
5. Bullet Point Optimizations:
   - Identify 2 to 4 bullet points from the resume that could be strengthened for this role.
   - Rewrite them following the strict Anti-AI 2026 rules above. Sound like an elite senior developer, not an AI.
   - Explain the technical rationale simply and practically.`;

    parts.push({ text: prompt });

    // 3. Execute Gemini 2.5 Flash Structured Inference
    const response = await geminiAtsClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            overallScore: { type: "integer" },
            matchGrade: {
              type: "string",
              enum: ["Exceptional", "Strong", "Moderate", "Low"],
            },
            executiveSummary: { type: "string" },
            dimensions: {
              type: "object",
              properties: {
                hardSkillsScore: { type: "integer" },
                experienceScore: { type: "integer" },
                softSkillsScore: { type: "integer" },
                formatScore: { type: "integer" },
              },
              required: [
                "hardSkillsScore",
                "experienceScore",
                "softSkillsScore",
                "formatScore",
              ],
            },
            keywordAnalysis: {
              type: "object",
              properties: {
                matchedKeywords: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      keyword: { type: "string" },
                      category: {
                        type: "string",
                        enum: ["hard_skill", "soft_skill", "tool", "domain"],
                      },
                      contextFound: { type: "string" },
                    },
                    required: ["keyword", "category"],
                  },
                },
                missingKeywords: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      keyword: { type: "string" },
                      category: {
                        type: "string",
                        enum: ["hard_skill", "soft_skill", "tool", "domain"],
                      },
                      importance: {
                        type: "string",
                        enum: ["critical", "recommended", "optional"],
                      },
                      placementAdvice: { type: "string" },
                    },
                    required: ["keyword", "category", "importance", "placementAdvice"],
                  },
                },
              },
              required: ["matchedKeywords", "missingKeywords"],
            },
            formattingWarnings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: {
                    type: "string",
                    enum: ["warning", "caution", "good"],
                  },
                  title: { type: "string" },
                  description: { type: "string" },
                },
                required: ["severity", "title", "description"],
              },
            },
            bulletOptimizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  originalBullet: { type: "string" },
                  improvedBullet: { type: "string" },
                  reasoning: { type: "string" },
                  addedKeywords: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: [
                  "originalBullet",
                  "improvedBullet",
                  "reasoning",
                  "addedKeywords",
                ],
              },
            },
          },
          required: [
            "overallScore",
            "matchGrade",
            "executiveSummary",
            "dimensions",
            "keywordAnalysis",
            "formattingWarnings",
            "bulletOptimizations",
          ],
        },
      },
    });

    const responseText = response.text || "";
    if (!responseText) {
      return {
        success: false,
        error: "AI analysis returned an empty result. Please try again.",
      };
    }

    const parsedData: AtsAnalysisResult = JSON.parse(responseText);
    return {
      success: true,
      data: parsedData,
    };
  } catch (err) {
    console.error("[ATS Action] Error running resume analysis:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while analyzing your resume.",
    };
  }
}
