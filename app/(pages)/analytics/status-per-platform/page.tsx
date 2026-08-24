import { Suspense } from "react";
import dynamicImport from "next/dynamic";
import { getStatusPerPlatform, getYears } from "@/app/actions/analytics";
import { AnalyticsFilter } from "../components/analytics-filter";

const PlatformRoiDashboard = dynamicImport(
  () =>
    import("../components/platform-roi-dashboard").then(
      (m) => m.PlatformRoiDashboard,
    ),
  {
    loading: () => (
      <div className="min-h-[400px] bg-card rounded-xl border border-border/30 animate-pulse" />
    ),
  },
);

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "JAT | Status Per Platform",
  };
}

export default async function StatusPerPlatformPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const month =
    typeof searchParams.month === "string" ? searchParams.month : undefined;
  const year =
    typeof searchParams.year === "string" ? searchParams.year : undefined;

  const currentYear = new Date().getFullYear().toString();

  const [statusPerPlatform, years] = await Promise.all([
    getStatusPerPlatform(month, year),
    getYears(),
  ]);

  const availableYears = years.length > 0 ? years : [currentYear];

  return (
    <div className="flex flex-col gap-6 w-full opacity-100 transition-opacity duration-500">
      <h1 className="sr-only">Platform ROI & Application Status</h1>
      <Suspense
        fallback={
          <div className="h-14 w-full bg-card rounded-xl animate-pulse" />
        }
      >
        <AnalyticsFilter years={availableYears} />
      </Suspense>

      <PlatformRoiDashboard data={statusPerPlatform} />
    </div>
  );
}
