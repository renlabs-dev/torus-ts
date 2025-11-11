"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { NavigationItems } from "./navigation-items";

export function PageNavigation() {
  const router = useRouter();

  return (
    <div className="relative">
      {/* Vertical borders spanning full height */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />
      <div
        className={`relative mx-auto flex max-w-screen-lg items-center justify-between px-4 py-2 text-lg`}
      >
        <button
          onClick={() => router.back()}
          className="text-link text-muted-foreground group relative flex items-center justify-start gap-2 font-medium transition-colors duration-200 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back
        </button>
        <NavigationItems />
      </div>
      {/* Bottom border */}
      <div className="border-border relative border-t" />
    </div>
  );
}
