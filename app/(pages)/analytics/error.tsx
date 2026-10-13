"use client";

import {
  RouteErrorFallback,
  type RouteErrorProps,
} from "@/app/_components/route-error";

export default function AnalyticsError(props: RouteErrorProps) {
  return (
    <RouteErrorFallback
      {...props}
      title="Couldn't load your analytics"
      description="We weren't able to calculate your application insights."
    />
  );
}
