"use client";

import {
  RouteErrorFallback,
  type RouteErrorProps,
} from "@/app/_components/route-error";

export default function DocumentsError(props: RouteErrorProps) {
  return (
    <RouteErrorFallback
      {...props}
      title="Couldn't load your documents"
      description="We weren't able to fetch your career documents."
    />
  );
}
