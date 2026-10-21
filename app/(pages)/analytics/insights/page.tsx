import { redirect } from "next/navigation";
import { overviewHref } from "@/lib/analytics/search-params";

export const dynamic = "force-dynamic";

export default async function InsightsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  redirect(overviewHref(await props.searchParams, new Date()));
}
