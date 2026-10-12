/**
 * Verification Test Suite for Job Application Tracker User Flows
 * Covers: /applications, /analytics/overview, /analytics/insights, /ats-checker, /documents
 */

import {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationHistory,
  deleteStatusHistoryEntry,
  getDistinctLocationsAndPlatforms,
  syncGhostedApplications,
} from "../app/actions/applications";

import {
  getDetailedApplicationBreakdown,
  getGhostedApplications,
  getStatusPerPlatform,
  getDomainLeaderboard,
  getApplicationsPerYear,
  getStasusesPerYear,
  getYears,
  getBestPlatformInsight,
  getFunnelBottleneckInsight,
} from "../app/actions/analytics";

import {
  getWorkModeAnalysis,
  getSalaryInsights,
  getPlatformRoi,
  getBlackHoleBreakdown,
  getRoleTargetingAnalysis,
} from "../app/(pages)/analytics/insights/actions";

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
  console.log("▶ [Flow 1/5] Auditing Applications Tracker Flow (/applications)...");

  // 1.1 List initial applications
  const initialApps = await getApplications();
  assert(initialApps.length >= 18, `Seed applications loaded (${initialApps.length} found, expected >= 18)`);

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
  const appsAfterCreate = await getApplications();
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
  const appsAfterDelete = await getApplications();
  assert(!appsAfterDelete.some((a) => a.id === createdId), "Deleted application successfully removed from list");

  // 1.7 Sync ghosted applications
  const ghostedCount = await syncGhostedApplications();
  assert(typeof ghostedCount === "number", `Ghosted sync executed successfully (${ghostedCount} apps transitioned)`);
  console.log("  ✅ Applications Tracker Flow passed!\n");

  // ----------------------------------------------------
  // FLOW 2: ANALYTICS OVERVIEW (/analytics/overview)
  // ----------------------------------------------------
  console.log("▶ [Flow 2/5] Auditing Analytics Overview Flow (/analytics/overview)...");

  // 2.1 Detailed breakdown metrics
  const breakdown = await getDetailedApplicationBreakdown();
  assert(breakdown.total >= 18, `Funnel breakdown analyzed ${breakdown.total} applications`);
  assert(breakdown.stages.applied === breakdown.total, "All applications registered in 'applied' stage");
  assert(breakdown.stages.interview > 0, `Interview stage reached by ${breakdown.stages.interview} candidates`);
  assert(breakdown.resumeConversion > 0, `Resume pass rate computed (${breakdown.resumeConversion.toFixed(1)}%)`);
  assert(breakdown.interviewConversion > 0, `Interview conversion computed (${breakdown.interviewConversion.toFixed(1)}%)`);
  assert(breakdown.averageResponseDays !== null, `Average recruiter response velocity: ${breakdown.averageResponseDays} days`);

  // 2.2 Ghosted applications radar
  const ghostedData = await getGhostedApplications();
  assert(ghostedData.count > 0, `Ghosted radar identified ${ghostedData.count} ghosted applications`);
  assert(ghostedData.companies.length > 0, `Identified top ghosting companies: ${ghostedData.companies.join(", ")}`);
  assert(ghostedData.followUpQueue.length > 0, `Follow-up radar identified ${ghostedData.followUpQueue.length} jobs in 7-14 day window`);

  // 2.3 Platform performance
  const platformStats = await getStatusPerPlatform();
  assert(platformStats.length > 0, `Platform breakdown calculated across ${platformStats.length} platforms`);
  const topPlatform = platformStats[0];
  assert(topPlatform.total > 0, `Top platform '${topPlatform.platformName}' has ${topPlatform.total} applications`);

  // 2.4 Domain leaderboard & time-series
  const leaderboard = await getDomainLeaderboard();
  assert(leaderboard.length > 0, `Domain leaderboard generated (${leaderboard.length} domains)`);

  const appsPerYear = await getApplicationsPerYear();
  assert(appsPerYear.length > 0, `Time series applications per year generated (${appsPerYear.length} year groups)`);

  const statusesPerYear = await getStasusesPerYear();
  assert(statusesPerYear.length > 0, "Statuses per year timeline generated");

  const years = await getYears();
  assert(years.length > 0, `Available years: ${years.join(", ")}`);

  // 2.5 Insights heuristics
  const bestPlatform = await getBestPlatformInsight();
  assert(bestPlatform.bestPlatform !== null, `Best platform insight: ${bestPlatform.bestPlatform?.name} (${bestPlatform.bestPlatform?.interviewRate.toFixed(1)}% interview yield)`);

  const bottleneck = await getFunnelBottleneckInsight();
  assert(Boolean(bottleneck.headline), `Funnel bottleneck diagnostic: "${bottleneck.headline}" [${bottleneck.health}]`);
  console.log("  ✅ Analytics Overview Flow passed!\n");

  // ----------------------------------------------------
  // FLOW 3: ANALYTICS INSIGHTS (/analytics/insights)
  // ----------------------------------------------------
  console.log("▶ [Flow 3/5] Auditing Analytics Insights Flow (/analytics/insights)...");

  // 3.1 Work mode analysis
  const workModes = await getWorkModeAnalysis();
  assert(workModes.length === 3, "Work mode analysis includes Remote, Hybrid, and On-site");
  const remote = workModes.find((m) => m.name === "Remote");
  assert(Boolean(remote && remote.total > 0), `Remote jobs analyzed: ${remote?.total} jobs (${remote?.sharePct.toFixed(1)}% share)`);

  // 3.2 Salary insights
  const salaryInsights = await getSalaryInsights();
  assert(salaryInsights.statedCount > 0, `Salary stated in ${salaryInsights.statedCount}/${salaryInsights.totalCount} applications`);
  assert(salaryInsights.avgSalary !== null && salaryInsights.avgSalary > 100000, `Average market salary computed: $${salaryInsights.avgSalary?.toLocaleString()}`);
  assert(Boolean(salaryInsights.topRole), `Top paying role identified: ${salaryInsights.topRole} at ${salaryInsights.topCompany} (${salaryInsights.topSalaryFormatted})`);

  // 3.3 Platform ROI
  const platformRoi = await getPlatformRoi();
  assert(platformRoi.length > 0, `Platform ROI computed (${platformRoi.length} platforms ranked)`);

  // 3.4 Black hole breakdown
  const blackHole = await getBlackHoleBreakdown();
  assert(blackHole.ghosted + blackHole.rejected > 0, `Black hole analyzed: ${blackHole.ghosted} ghosted, ${blackHole.rejected} rejected`);

  // 3.5 Role targeting
  const roleTargeting = await getRoleTargetingAnalysis();
  assert(roleTargeting.length > 0, `Role targeting normalized: ${roleTargeting.map((r) => `${r.name} (${r.count})`).join(", ")}`);
  console.log("  ✅ Analytics Insights Flow passed!\n");

  // ----------------------------------------------------
  // FLOW 4: ATS RESUME COMPATIBILITY SCANNER (/ats-checker)
  // ----------------------------------------------------
  console.log("▶ [Flow 4/5] Auditing ATS Compatibility Scanner Flow (/ats-checker)...");

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
  // FLOW 5: DOCUMENTS MANAGEMENT (/documents)
  // ----------------------------------------------------
  console.log("▶ [Flow 5/5] Auditing Documents Management Flow (/documents)...");

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
