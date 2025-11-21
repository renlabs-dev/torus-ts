"use client";

import { ArrowLeft, BookOpenText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { NavigationItems } from "./navigation-items";

export function PageNavigation() {
  const router = useRouter();
  const hasInternalHistory = useRef(false);

  useEffect(() => {
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;

    if (referrer.startsWith(currentOrigin)) {
      hasInternalHistory.current = true;
    }
  }, []);

  const handleBack = () => {
    if (hasInternalHistory.current) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="relative">
      {/* Vertical borders spanning full height */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />
      <div
        className={`relative mx-auto flex max-w-screen-lg items-center justify-between px-4 py-2 text-lg`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-link text-muted-foreground group relative flex items-center justify-start gap-2 font-medium transition-colors duration-200 hover:underline"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Back
          </button>
          <div className="border-border h-6 border-l" />
          <Link
            href="/"
            className="text-link text-muted-foreground group relative flex items-center justify-start gap-2 font-medium transition-colors duration-200 hover:underline"
          >
            <BookOpenText className="h-4 w-4" />
            Home
          </Link>
        </div>
        <NavigationItems />
      </div>
      {/* Bottom border */}
      <div className="border-border relative border-t" />
    </div>
  );
}
