"use client";

import {
  RouteErrorFallback,
  type RouteErrorProps,
} from "@/app/_components/route-error";

export default function AtsCheckerError(props: RouteErrorProps) {
  return (
    <RouteErrorFallback
      {...props}
      title="Couldn't load the ATS checker"
      description="We weren't able to load the resume checker or your saved documents."
    />
  );
}
