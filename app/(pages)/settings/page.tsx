import Link from "next/link";
import { getCurrentUserIdOrThrow } from "@/app/actions/_utils/user-context";
import { collectUserData } from "@/lib/account-data";
import { DEFAULT_PREFERENCES } from "@/lib/preference-options";
import { getClerkUserId } from "@/lib/auth/clerk-session";
import { ProfileCard } from "./components/profile-card";
import { ExportDataCard } from "./components/export-data-card";
import { DeleteAccountCard } from "./components/delete-account-card";
import { PreferencesCard } from "./components/preferences-card";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "JAT | Settings",
  };
}

export default async function SettingsPage() {
  const userId = await getCurrentUserIdOrThrow();
  const [clerkUserId, data] = await Promise.all([
    getClerkUserId(),
    collectUserData(userId),
  ]);
  const signedIn = clerkUserId !== null && clerkUserId === userId;
  const counts = {
    applications: data.applications.length,
    statusHistory: data.statusHistory.length,
    documents: data.documents.length,
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and analytics preferences, download a copy of your data, or delete it.
        </p>
      </div>

      <ProfileCard signedIn={signedIn} />
      <PreferencesCard preferences={data.preferences ?? DEFAULT_PREFERENCES} />
      <ExportDataCard counts={counts} />
      <DeleteAccountCard signedIn={signedIn} counts={counts} />

      <p className="text-xs text-muted-foreground">
        Read how we handle your data in the{" "}
        <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}
