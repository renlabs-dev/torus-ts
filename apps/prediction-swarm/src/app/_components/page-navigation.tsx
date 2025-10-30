import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function PageNavigation() {
  return (
    <div className="relative">
      {/* Vertical borders spanning full height */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />
      <div className={`relative mx-auto max-w-screen-lg px-4 py-2 text-lg`}>
        <Link
          href="/"
          className="text-link text-muted-foreground group relative mx-auto flex items-center justify-start gap-2 font-medium transition-colors duration-200 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back
        </Link>
      </div>
      {/* Bottom border */}
      <div className="border-border relative border-t" />
    </div>
  );
}
