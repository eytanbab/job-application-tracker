"use client";

import {
  RouteErrorFallback,
  type RouteErrorProps,
} from "@/app/_components/route-error";

export default function PagesError(props: RouteErrorProps) {
  return (
    <RouteErrorFallback
      {...props}
      title="Something went wrong"
      description="This page couldn't be displayed."
    />
  );
}
