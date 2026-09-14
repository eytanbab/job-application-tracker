import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InsightsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();
  if (typeof searchParams.month === "string")
    params.set("month", searchParams.month);
  if (typeof searchParams.year === "string")
    params.set("year", searchParams.year);

  const query = params.toString();
  redirect(`/analytics/overview${query ? `?${query}` : ""}`);
}
