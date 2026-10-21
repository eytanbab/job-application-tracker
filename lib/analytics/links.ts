import type { Stage } from "@/lib/applications/list-query";
import type { DateRange } from "./types";

interface TrackerLink {
  range?: DateRange;
  stage?: Stage;
  /** A status, a comma list or a group ("active", "closed"). */
  status?: string;
  platform?: string;
  appId?: string;
  search?: string;
}

/** Link to the tracker showing exactly the applications behind a number. */
export function trackerHref({ range, stage, status, platform, appId, search }: TrackerLink): string {
  const params = new URLSearchParams();
  if (appId) params.set("appId", appId);
  if (search) params.set("q", search);
  if (status) params.set("status", status);
  if (stage) params.set("stage", stage);
  if (platform) params.set("platform", platform);
  if (range?.from) params.set("from", range.from);
  if (range?.to) params.set("to", range.to);
  const query = params.toString();
  return `/applications${query ? `?${query}` : ""}`;
}
