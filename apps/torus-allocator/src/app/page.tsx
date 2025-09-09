import { Button } from "@torus-ts/ui/components/button";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { getLinks } from "@torus-ts/ui/lib/data";
import { env } from "~/env";
import Link from "next/link";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Torus Allocator - Moved to Portal",
    description:
      "The Torus Allocator has moved to the Torus Portal. Access agent allocation and weight management through the integrated portal interface.",
    keywords: [
      "torus allocator",
      "agent allocation",
      "weight management",
      "portal integration",
      "network allocation",
    ],
    ogSiteName: "Torus Allocator",
    canonical: "/",
    baseUrl: env("BASE_URL"),
  });
}

export default function Page() {
  const links = getLinks(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">The Allocator has moved!</h1>
        <p className="mb-4 text-gray-600">
          The Allocator is now integrated into the Torus Portal.
        </p>
        <Button variant="outline">
          <Link href={`${links.portal}/root-allocator`}>
            Go to Portal Allocator
          </Link>
        </Button>
      </div>
    </div>
  );
}
