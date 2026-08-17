import { getSavedResumes } from "@/app/actions/ats";
import { AtsCheckerClient } from "./components/ats-checker-client";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "JAT | ATS Resume Checker",
  };
}

export default async function AtsCheckerPage() {
  const savedDocuments = await getSavedResumes();

  return (
    <div className="flex flex-col gap-6 w-full opacity-100 transition-opacity duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          ATS Resume Checker & Optimizer
        </h1>
        <p className="text-sm text-muted-foreground">
          Compare your resume against any target job description to diagnose keyword gaps, evaluate ATS parseability, and optimize bullet points with Gemini 2.5.
        </p>
      </div>

      <AtsCheckerClient savedDocuments={savedDocuments} />
    </div>
  );
}
