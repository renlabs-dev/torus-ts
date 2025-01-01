"use client";

import { useSearchParams } from "next/navigation";

export function IdeasContent() {
  const searchParams = useSearchParams();

  const view = searchParams.get("view");
  if (view !== "ideas") return null;

  return <p>No ideas found.</p>;
}
