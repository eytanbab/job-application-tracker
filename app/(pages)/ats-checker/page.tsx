import { getSavedResumes } from "@/app/actions/ats";
import { requireSignedInUser } from "@/app/actions/_utils/require-signed-in-user";
import { AtsCheckerClient } from "./components/ats-checker-client";
import { AtsSignInGate } from "./components/ats-sign-in-gate";

export const dynamic = "force-dynamic";
// Bounds the analyzeResumeWithAts server action, which retries Gemini for up
// to ATS_GEMINI_DEADLINE_MS (app/actions/ats.ts).
export const maxDuration = 60;

export async function generateMetadata() {
  return {
    title: "JAT | ATS Resume Checker",
  };
}

export default async function AtsCheckerPage() {
  const user = await requireSignedInUser();
  const savedDocuments = user.ok ? await getSavedResumes() : [];

  return (
    <div className="flex flex-col gap-6 w-full opacity-100 transition-opacity duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          ATS Resume Checker & Optimizer
        </h1>
        <p className="text-sm text-muted-foreground">
          Compare your resume against any target job description to diagnose keyword gaps, evaluate ATS parseability, and optimize bullet points with Gemini 3.5.
        </p>
      </div>

      {user.ok ? (
        <AtsCheckerClient savedDocuments={savedDocuments} />
      ) : (
        <AtsSignInGate />
      )}
    </div>
  );
}
