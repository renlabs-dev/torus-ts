import { Button } from "@torus-ts/ui/components/button";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { getLinks } from "@torus-ts/ui/lib/data";
import { env } from "~/env";
import Link from "next/link";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Torus Allocator",
    description:
      "Allocate network resources and manage agent weights on the Torus Network. Access the integrated allocation interface through the Torus Portal.",
    keywords: [
      "torus allocator",
      "agent allocation",
      "weight management",
      "network resources",
      "resource allocation",
      "agent weights",
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
