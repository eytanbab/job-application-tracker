"use client";

import {
  RouteErrorFallback,
  type RouteErrorProps,
} from "@/app/_components/route-error";

export default function ApplicationsError(props: RouteErrorProps) {
  return (
    <RouteErrorFallback
      {...props}
      title="Couldn't load your applications"
      description="We weren't able to fetch your job applications."
      backHref="/"
      backLabel="Back to home"
    />
  );
}
