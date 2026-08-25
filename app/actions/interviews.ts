"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/app/db";
import {
  interviews,
  jobApplications,
  applicationStatusHistory,
  documents,
} from "@/app/db/schema";
import { and, eq, desc, asc, gte } from "drizzle-orm";
import { applicationsTag, interviewsTag } from "./_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "./_utils/user-context";
import { geminiAtsClient } from "@/lib/gemini";
import {
  InterviewItem,
  UpcomingInterviewItem,
  pipelineTemplates,
  getRoundTypeLabel,
} from "@/lib/interviews";
import { format as dateFnsFormat } from "date-fns";

function purgeInterviewCaches(userId: string) {
  revalidateTag(applicationsTag(userId), "max");
  revalidateTag(interviewsTag(userId), "max");
  revalidatePath("/applications");
  revalidatePath("/analytics/overview");
  revalidatePath("/analytics/insights");
}

export async function getInterviews(applicationId: string): Promise<InterviewItem[]> {
  const userId = await getCurrentUserIdOrThrow();

  const rows = await db
    .select()
    .from(interviews)
    .where(
      and(
        eq(interviews.applicationId, applicationId),
        eq(interviews.userId, userId),
      ),
    )
    .orderBy(asc(interviews.roundNumber), asc(interviews.createdAt));

  return rows as InterviewItem[];
}

export async function getUpcomingInterviews(): Promise<UpcomingInterviewItem[]> {
  const userId = await getCurrentUserIdOrThrow();

  const now = new Date();
  // Start from 24 hours ago to show recent interviews for debriefing
  const startWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: interviews.id,
      applicationId: interviews.applicationId,
      userId: interviews.userId,
      roundType: interviews.roundType,
      roundLabel: interviews.roundLabel,
      roundNumber: interviews.roundNumber,
      scheduledAt: interviews.scheduledAt,
      durationMins: interviews.durationMins,
      timezone: interviews.timezone,
      format: interviews.format,
      meetingLink: interviews.meetingLink,
      location: interviews.location,
      interviewerName: interviews.interviewerName,
      interviewerTitle: interviews.interviewerTitle,
      interviewerLinkedin: interviews.interviewerLinkedin,
      status: interviews.status,
      prepNotes: interviews.prepNotes,
      questionsToAsk: interviews.questionsToAsk,
      focusAreas: interviews.focusAreas,
      sentiment: interviews.sentiment,
      debriefNotes: interviews.debriefNotes,
      questionsAsked: interviews.questionsAsked,
      nextSteps: interviews.nextSteps,
      createdAt: interviews.createdAt,
      updatedAt: interviews.updatedAt,
      role_name: jobApplications.role_name,
      company_name: jobApplications.company_name,
      link: jobApplications.link,
      appLocation: jobApplications.location,
      platform: jobApplications.platform,
    })
    .from(interviews)
    .innerJoin(jobApplications, eq(jobApplications.id, interviews.applicationId))
    .where(
      and(
        eq(interviews.userId, userId),
        eq(interviews.status, "scheduled"),
        gte(interviews.scheduledAt, startWindow),
      ),
    )
    .orderBy(asc(interviews.scheduledAt))
    .limit(10);

  return rows as UpcomingInterviewItem[];
}

export async function createInterview(data: {
  applicationId: string;
  roundType: string;
  roundLabel?: string | null;
  scheduledAt?: Date | string | null;
  durationMins?: string | null;
  timezone?: string | null;
  format?: string;
  meetingLink?: string | null;
  location?: string | null;
  interviewerName?: string | null;
  interviewerTitle?: string | null;
  interviewerLinkedin?: string | null;
  prepNotes?: string | null;
  questionsToAsk?: string | null;
  focusAreas?: string | null;
}) {
  const userId = await getCurrentUserIdOrThrow();

  // Find existing rounds to determine next round number
  const existingRounds = await db
    .select({ roundNumber: interviews.roundNumber })
    .from(interviews)
    .where(
      and(
        eq(interviews.applicationId, data.applicationId),
        eq(interviews.userId, userId),
      ),
    );

  const nextRoundNumber = String(existingRounds.length + 1);

  const scheduledDate = data.scheduledAt
    ? typeof data.scheduledAt === "string"
      ? new Date(data.scheduledAt)
      : data.scheduledAt
    : null;

  const result = await db
    .insert(interviews)
    .values({
      applicationId: data.applicationId,
      userId,
      roundType: data.roundType,
      roundLabel: data.roundLabel || null,
      roundNumber: nextRoundNumber,
      scheduledAt: scheduledDate,
      durationMins: data.durationMins || "30",
      timezone: data.timezone || null,
      format: data.format || "video",
      meetingLink: data.meetingLink || null,
      location: data.location || null,
      interviewerName: data.interviewerName || null,
      interviewerTitle: data.interviewerTitle || null,
      interviewerLinkedin: data.interviewerLinkedin || null,
      status: "scheduled",
      prepNotes: data.prepNotes || null,
      questionsToAsk: data.questionsToAsk || null,
      focusAreas: data.focusAreas || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // If application is in applied or review stage, update application to interview stage
  const app = await db
    .select()
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.id, data.applicationId),
        eq(jobApplications.userId, userId),
      ),
    )
    .limit(1);

  if (app.length > 0) {
    const currentCategory = app[0].statusCategory;
    if (currentCategory === "applied" || currentCategory === "review" || currentCategory === "ghosted") {
      const stageLabel = getRoundTypeLabel(data.roundType, data.roundLabel);
      const newStatus = `Interview - ${stageLabel}`;

      await db
        .update(jobApplications)
        .set({
          statusCategory: "interview",
          status: newStatus,
        })
        .where(eq(jobApplications.id, data.applicationId));

      await db.insert(applicationStatusHistory).values({
        applicationId: data.applicationId,
        status: newStatus,
        statusCategory: "interview",
        createdAt: new Date(),
      });
    }
  }

  purgeInterviewCaches(userId);
  return result[0];
}

export async function updateInterview(
  id: string,
  data: Partial<{
    roundType: string;
    roundLabel: string | null;
    roundNumber: string;
    scheduledAt: Date | string | null;
    durationMins: string | null;
    timezone: string | null;
    format: string;
    meetingLink: string | null;
    location: string | null;
    interviewerName: string | null;
    interviewerTitle: string | null;
    interviewerLinkedin: string | null;
    status: string;
    prepNotes: string | null;
    questionsToAsk: string | null;
    focusAreas: string | null;
    sentiment: string | null;
    debriefNotes: string | null;
    questionsAsked: string | null;
    nextSteps: string | null;
  }>,
) {
  const userId = await getCurrentUserIdOrThrow();

  const scheduledDate = data.scheduledAt !== undefined
    ? data.scheduledAt
      ? typeof data.scheduledAt === "string"
        ? new Date(data.scheduledAt)
        : data.scheduledAt
      : null
    : undefined;

  const updateValues: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };

  if (scheduledDate !== undefined) {
    updateValues.scheduledAt = scheduledDate;
  }

  const result = await db
    .update(interviews)
    .set(updateValues)
    .where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
    .returning();

  purgeInterviewCaches(userId);
  return result[0];
}

export async function deleteInterview(id: string) {
  const userId = await getCurrentUserIdOrThrow();

  const target = await db
    .select({ applicationId: interviews.applicationId })
    .from(interviews)
    .where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
    .limit(1);

  if (!target.length) {
    throw new Error("Interview not found or unauthorized");
  }

  const applicationId = target[0].applicationId;

  await db
    .delete(interviews)
    .where(and(eq(interviews.id, id), eq(interviews.userId, userId)));

  // Renumber remaining rounds sequentially
  const remaining = await db
    .select({ id: interviews.id })
    .from(interviews)
    .where(
      and(
        eq(interviews.applicationId, applicationId),
        eq(interviews.userId, userId),
      ),
    )
    .orderBy(asc(interviews.roundNumber), asc(interviews.createdAt));

  for (let i = 0; i < remaining.length; i++) {
    await db
      .update(interviews)
      .set({ roundNumber: String(i + 1) })
      .where(eq(interviews.id, remaining[i].id));
  }

  purgeInterviewCaches(userId);
}

export async function reorderInterviews(
  applicationId: string,
  orderedIds: string[],
) {
  const userId = await getCurrentUserIdOrThrow();

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(interviews)
      .set({ roundNumber: String(i + 1), updatedAt: new Date() })
      .where(
        and(
          eq(interviews.id, orderedIds[i]),
          eq(interviews.applicationId, applicationId),
          eq(interviews.userId, userId),
        ),
      );
  }

  purgeInterviewCaches(userId);
}

export async function createPipelineFromTemplate(
  applicationId: string,
  templateKey: keyof typeof pipelineTemplates,
) {
  const userId = await getCurrentUserIdOrThrow();
  const template = pipelineTemplates[templateKey];

  if (!template) {
    throw new Error("Invalid pipeline template");
  }

  // Get current max round number
  const existingRounds = await db
    .select({ id: interviews.id })
    .from(interviews)
    .where(
      and(
        eq(interviews.applicationId, applicationId),
        eq(interviews.userId, userId),
      ),
    );

  const startNumber = existingRounds.length + 1;

  for (let i = 0; i < template.rounds.length; i++) {
    const round = template.rounds[i];
    await db.insert(interviews).values({
      applicationId,
      userId,
      roundType: round.roundType,
      roundLabel: round.roundLabel,
      roundNumber: String(startNumber + i),
      durationMins: round.durationMins,
      format: "video",
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Update application status to interview
  const app = await db
    .select()
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.id, applicationId),
        eq(jobApplications.userId, userId),
      ),
    )
    .limit(1);

  if (app.length > 0 && app[0].statusCategory !== "interview" && app[0].statusCategory !== "accepted") {
    await db
      .update(jobApplications)
      .set({
        statusCategory: "interview",
        status: `Interview - ${template.rounds[0].roundLabel}`,
      })
      .where(eq(jobApplications.id, applicationId));

    await db.insert(applicationStatusHistory).values({
      applicationId,
      status: `Interview - ${template.rounds[0].roundLabel}`,
      statusCategory: "interview",
      createdAt: new Date(),
    });
  }

  purgeInterviewCaches(userId);
}

export async function generateAiInterviewPrep(interviewId: string) {
  const userId = await getCurrentUserIdOrThrow();

  const interviewRows = await db
    .select({
      id: interviews.id,
      roundType: interviews.roundType,
      roundLabel: interviews.roundLabel,
      format: interviews.format,
      interviewerName: interviews.interviewerName,
      interviewerTitle: interviews.interviewerTitle,
      prepNotes: interviews.prepNotes,
      applicationId: interviews.applicationId,
      role_name: jobApplications.role_name,
      company_name: jobApplications.company_name,
      description: jobApplications.description,
      notes: jobApplications.notes,
    })
    .from(interviews)
    .innerJoin(jobApplications, eq(jobApplications.id, interviews.applicationId))
    .where(and(eq(interviews.id, interviewId), eq(interviews.userId, userId)))
    .limit(1);

  if (!interviewRows.length) {
    throw new Error("Interview not found or unauthorized");
  }

  const item = interviewRows[0];
  const stageName = getRoundTypeLabel(item.roundType, item.roundLabel);

  const prompt = `You are an elite executive career coach and technical interview strategist in August 2026.
Generate a tailored, high-signal preparation briefing for the following upcoming interview.

CONTEXT:
- Role: ${item.role_name}
- Company: ${item.company_name}
- Interview Stage: ${stageName} (Format: ${item.format})
${item.interviewerName ? `- Interviewer: ${item.interviewerName} (${item.interviewerTitle || "Interviewer"})` : ""}
${item.description ? `- Job Description Excerpt:\n${item.description.slice(0, 3000)}` : ""}
${item.notes ? `- Candidate's Application Notes:\n${item.notes}` : ""}

Provide structured output in JSON format matching this schema:
{
  "focusAreas": "Concise bulleted list of 3-5 high-priority technical or strategic themes to master for this specific round type",
  "questionsToAsk": "3-4 sharp, insightful questions the candidate should ask the interviewer to demonstrate seniority and deep interest",
  "prepNotes": "Detailed briefing covering company context, likely technical/behavioral probes, and STAR story frameworks to prepare",
  "defensibleStories": [
    {
      "topic": "Key experience or scenario",
      "starSummary": "Situation / Task / Action / Result bullet points to highlight"
    }
  ]
}

Return strictly valid JSON. Do not include markdown code fence formatting outside the JSON.`;

  const response = await geminiAtsClient.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const responseText = response.text || "{}";
  let parsedData: {
    focusAreas?: string;
    questionsToAsk?: string;
    prepNotes?: string;
    defensibleStories?: Array<{ topic: string; starSummary: string }>;
  } = {};

  try {
    parsedData = JSON.parse(responseText);
  } catch (err) {
    console.error("Failed to parse AI prep output:", err);
  }

  const focusAreas = parsedData.focusAreas || "";
  const questionsToAsk = parsedData.questionsToAsk || "";
  const prepNotes = parsedData.prepNotes || "";

  // Update interview record with AI prep data
  await db
    .update(interviews)
    .set({
      focusAreas: focusAreas || item.prepNotes,
      questionsToAsk: questionsToAsk,
      prepNotes: prepNotes,
      updatedAt: new Date(),
    })
    .where(eq(interviews.id, interviewId));

  purgeInterviewCaches(userId);

  return {
    focusAreas,
    questionsToAsk,
    prepNotes,
    defensibleStories: parsedData.defensibleStories || [],
  };
}
