/**
 * Verification Test Suite for Job Application Tracker User Flows
 * Covers: /applications, /analytics/overview, /ats-checker, /documents
 */

import {
  getApplicationsPage,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationHistory,
  deleteStatusHistoryEntry,
  getDistinctLocationsAndPlatforms,
  syncGhostedApplications,
} from "../app/actions/applications";

import { getAnalyticsOverview } from "../lib/analytics/load";

import {
  getSavedResumes,
  analyzeResumeWithAts,
} from "../app/actions/ats";

import {
  getFiles,
  createFile,
  deleteFile,
  getViewUrl,
  getDownloadUrl,
  generatePresignedUrl,
} from "../app/actions/documents";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runAllFlowChecks() {
  console.log("=================================================");
  console.log("🚀 STARTING COMPREHENSIVE USER FLOW AUDIT (ZERO-CONFIG MOCK MODE)");
  console.log("=================================================\n");

  // ----------------------------------------------------
  // FLOW 1: APPLICATIONS TRACKER (/applications)
  // ----------------------------------------------------
  console.log("▶ [Flow 1/4] Auditing Applications Tracker Flow (/applications)...");

  // 1.1 List initial applications
  const initialPage = await getApplicationsPage({ size: 25 });
  const initialApps = initialPage.rows;
  assert(initialPage.total >= 18, `Seed applications loaded (${initialPage.total} found, expected >= 18)`);

  const vercelApp = initialApps.find((a) => a.company_name === "Vercel");
  assert(Boolean(vercelApp), "Found Vercel Senior Frontend Engineer application");
  assert(vercelApp?.statusCategory === "interview", "Vercel application is correctly at 'interview' stage");

  // 1.2 Distinct locations & platforms
  const { userLocations, userPlatforms } = await getDistinctLocationsAndPlatforms();
  assert(userLocations.length > 0, `Distinct locations identified (${userLocations.length} locations)`);
  assert(userPlatforms.length > 0, `Distinct platforms identified (${userPlatforms.length} platforms)`);

  // 1.3 Create new application
  const createRes = await createApplication({
    company_name: "Anthropic",
    role_name: "Staff AI Interface Engineer",
    date_applied: "2026-09-15",
    link: "https://jobs.lever.co/anthropic/staff-ai-interface",
    location: "San Francisco, CA (Hybrid)",
    platform: "lever",
    status: "Applied",
    statusCategory: "applied",
    salary: "$240,000 - $310,000",
    description: "Building next-generation model interfaces.",
    notes: "Applied via direct team referral.",
  });
  const createdId = createRes[0]?.insertedId;
  assert(Boolean(createdId), `Successfully created new application with ID: ${createdId}`);

  // Verify it appears in applications list
  const appsAfterCreate = (await getApplicationsPage({ q: "Anthropic", size: 25 })).rows;
  const foundCreated = appsAfterCreate.find((a) => a.id === createdId);
  assert(Boolean(foundCreated), "Newly created Anthropic application appears in application list");

  // 1.4 Update application status & verify history
  await updateApplication({
    id: createdId,
    company_name: "Anthropic",
    role_name: "Staff AI Interface Engineer",
    date_applied: "2026-09-15",
    link: "https://jobs.lever.co/anthropic/staff-ai-interface",
    location: "San Francisco, CA (Hybrid)",
    platform: "lever",
    status: "Recruiter Screen",
    statusCategory: "interview",
    salary: "$240,000 - $310,000",
  });

  const history = await getApplicationHistory(createdId!);
  assert(history.length >= 2, `Timeline history reflects status progression (${history.length} timeline entries)`);
  assert(history[0].status === "Recruiter Screen", "Latest timeline status is 'Recruiter Screen'");

  // 1.5 Delete latest history entry and verify rollback
  const historyToDelete = history[0].id;
  const rollbackRes = await deleteStatusHistoryEntry(historyToDelete);
  assert(rollbackRes.statusCategory === "applied", `Status history deletion rolled back status to: ${rollbackRes.statusCategory}`);

  // 1.6 Delete application
  await deleteApplication(createdId!);
  const appsAfterDelete = (await getApplicationsPage({ q: "Anthropic", size: 25 })).rows;
  assert(!appsAfterDelete.some((a) => a.id === createdId), "Deleted application successfully removed from list");

  // 1.7 Sync ghosted applications
  const ghostedCount = await syncGhostedApplications();
  assert(typeof ghostedCount === "number", `Ghosted sync executed successfully (${ghostedCount} apps transitioned)`);
  console.log("  ✅ Applications Tracker Flow passed!\n");

  // ----------------------------------------------------
  // FLOW 2: ANALYTICS OVERVIEW (/analytics/overview)
  // ----------------------------------------------------
  console.log("▶ [Flow 2/4] Auditing Analytics Overview Flow (/analytics/overview)...");

  // 2.1 One overview for all time; every section must add up to the same totals
  const overview = await getAnalyticsOverview({ range: "all" });
  const { totals } = overview;
  assert(totals.applications >= 18, `Overview counts ${totals.applications} applications`);
  assert(totals.responded >= totals.interviewed, `Responded (${totals.responded}) >= reached interview (${totals.interviewed})`);
  assert(totals.interviewed >= totals.offers, `Reached interview (${totals.interviewed}) >= offers (${totals.offers})`);

  // 2.2 Platforms, work models and activity buckets match the totals
  const platformInterviews = overview.platforms.reduce((sum, p) => sum + p.interviewed.k, 0);
  assert(platformInterviews === totals.interviewed, `Platform interviews (${platformInterviews}) match the funnel`);
  const workModeTotal = overview.workModes.reduce((sum, m) => sum + m.total, 0);
  assert(workModeTotal === totals.applications, `Work model totals (${workModeTotal}) match applications`);
  const activityTotal = overview.activity.buckets.reduce((sum, b) => sum + b.total, 0);
  assert(activityTotal === totals.applications, `Activity buckets (${activityTotal}) match applications`);

  // 2.3 Salary, needs action and weekly pace
  assert(overview.salary.statedCount > 0, `Salary parsed for ${overview.salary.statedCount}/${overview.salary.totalCount} applications (${overview.salary.currency})`);
  assert(overview.weeks.length === 12, "Weekly pace covers the last 12 weeks");
  assert(overview.years.length > 0, `Years with applications: ${overview.years.join(", ")}`);
  const groups = Object.values(overview.needsAction);
  assert(groups.every((g) => g.items.length <= g.total), `Needs action lists ${groups.reduce((sum, g) => sum + g.total, 0)} applications`);

  // 2.4 Insights: weekly pace first, at most five, links point at the tracker
  assert(overview.insights[0]?.id === "weekly-pace", `First insight: "${overview.insights[0]?.text}"`);
  assert(overview.insights.length <= 5, `${overview.insights.length} insights: ${overview.insights.map((i) => i.id).join(", ")}`);
  assert(overview.insights.every((i) => !i.href || i.href.startsWith("/applications")), "Insight links open the tracker");

  // 2.5 A shorter period never counts more than all time
  const last30 = await getAnalyticsOverview({ range: "30d" });
  assert(last30.totals.applications <= totals.applications, `Last 30 days: ${last30.totals.applications} applications`);
  console.log("  ✅ Analytics Overview Flow passed!\n");

  // ----------------------------------------------------
  // FLOW 3: ATS RESUME COMPATIBILITY SCANNER (/ats-checker)
  // ----------------------------------------------------
  console.log("▶ [Flow 3/4] Auditing ATS Compatibility Scanner Flow (/ats-checker)...");

  // 4.1 Saved resumes retrieval
  const savedResumes = await getSavedResumes();
  assert(savedResumes.length > 0, `Saved resumes retrieved from library (${savedResumes.length} resumes)`);

  // 4.2 Validation: Reject short JD
  const shortJdScan = await analyzeResumeWithAts(
    { type: "text", text: "Senior Software Engineer with 5+ years building distributed cloud platforms." },
    "Short JD",
  );
  assert(!shortJdScan.success, "Correctly rejected job description shorter than 30 characters");

  // 4.3 Full ATS analysis with text resume
  const targetJd = `We are looking for a Senior Frontend Engineer to architect high-performance React and Next.js applications.
Responsibilities:
- Build responsive user interfaces using TypeScript, React 19, and Tailwind CSS.
- Optimize web application performance (Core Web Vitals) and reduce bundle latency.
- Collaborate with designers and backend engineers on GraphQL and REST APIs.
- Lead system design and mentor junior developers.
Requirements:
- 4+ years of professional software engineering experience.
- Deep expertise in TypeScript, React, and Next.js.
- Strong grounding in CI/CD, Docker, and AWS cloud environments.`;

  const resumeText = `Senior Full-Stack Software Engineer with 6 years experience architecting web systems.
Technical Skills: TypeScript, React, Next.js, Node.js, PostgreSQL, Tailwind CSS, Docker, AWS.
Experience:
- Architected enterprise Next.js and TypeScript application cutting latency by 40%.
- Led team of 5 engineers delivering high-scale GraphQL microservices on AWS and Docker.`;

  const textScan = await analyzeResumeWithAts({ type: "text", text: resumeText }, targetJd);
  assert(textScan.success, "ATS scan executed successfully for raw text input");
  if (textScan.success) {
    const d = textScan.data;
    assert(d.overallScore >= 0 && d.overallScore <= 100, `Overall score within valid range: ${d.overallScore}/100`);
    assert(["Exceptional", "Strong", "Moderate", "Low"].includes(d.matchGrade), `Match grade: ${d.matchGrade}`);
    assert(d.dimensions.hardSkillsScore > 0, `Hard skills score: ${d.dimensions.hardSkillsScore}/100`);
    assert(d.dimensions.experienceScore > 0, `Experience score: ${d.dimensions.experienceScore}/100`);
    assert(d.dimensions.softSkillsScore > 0, `Soft skills score: ${d.dimensions.softSkillsScore}/100`);
    assert(d.dimensions.formatScore > 0, `Format score: ${d.dimensions.formatScore}/100`);
    assert(d.keywordAnalysis.matchedKeywords.length > 0, `Matched keywords: ${d.keywordAnalysis.matchedKeywords.map((k) => k.keyword).join(", ")}`);
    assert(d.keywordAnalysis.missingKeywords.length > 0, `Missing keywords: ${d.keywordAnalysis.missingKeywords.map((k) => k.keyword).join(", ")}`);
    assert(d.formattingWarnings.length > 0, `Formatting checks generated (${d.formattingWarnings.length} checks)`);
    assert(d.bulletOptimizations.length > 0, `Bullet optimizations provided (${d.bulletOptimizations.length} rewritten bullets)`);
  }

  // 4.4 ATS scan with selected document from library
  const docScan = await analyzeResumeWithAts(
    { type: "document", documentId: savedResumes[0].id },
    targetJd,
  );
  assert(docScan.success, `ATS scan executed successfully for library document: "${savedResumes[0].title}"`);
  console.log("  ✅ ATS Compatibility Scanner Flow passed!\n");

  // ----------------------------------------------------
  // FLOW 4: DOCUMENTS MANAGEMENT (/documents)
  // ----------------------------------------------------
  console.log("▶ [Flow 4/4] Auditing Documents Management Flow (/documents)...");

  // 5.1 List documents
  const initialDocs = await getFiles();
  assert(initialDocs.length >= 2, `Documents library loaded (${initialDocs.length} documents)`);

  // 5.2 Presigned URL generation
  const presignRes = await generatePresignedUrl("test-resume-2026.pdf", "application/pdf");
  assert(!("error" in presignRes) && Boolean(presignRes.fileKey), `Presigned URL generated: ${presignRes.fileKey}`);

  // 5.3 Create document
  const testDocKey = presignRes.fileKey!;
  await createFile(
    "Staff Engineer Resume - Q4 2026",
    `https://mock-storage.local/${testDocKey}`,
    "test-resume-2026.pdf",
    testDocKey,
    "resume",
    "1.8 MB",
  );

  const docsAfterCreate = await getFiles();
  const createdDoc = docsAfterCreate.find((d) => d.file_key === testDocKey);
  assert(Boolean(createdDoc), "Created document appears in documents list");

  // 5.4 View and download URLs
  const viewRes = await getViewUrl(createdDoc!.id);
  assert(!("error" in viewRes) && Boolean(viewRes.url), "Inline view URL generated successfully");

  const downloadRes = await getDownloadUrl(createdDoc!.id);
  assert(!("error" in downloadRes) && Boolean(downloadRes.url), "Download URL generated successfully");

  // 5.5 Delete document
  await deleteFile(createdDoc!.id);
  const docsAfterDelete = await getFiles();
  assert(!docsAfterDelete.some((d) => d.id === createdDoc!.id), "Deleted document successfully removed from library");
  console.log("  ✅ Documents Management Flow passed!\n");

  console.log("=================================================");
  console.log("🎉 ALL USER FLOWS SUCCESSFULLY AUDITED & VERIFIED!");
  console.log("=================================================");
}

runAllFlowChecks().catch((err) => {
  console.error("❌ Fatal error during flow checks:", err);
  process.exit(1);
});
