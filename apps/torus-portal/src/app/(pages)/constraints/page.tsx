import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";

// import ConstraintFlowWrapper from "./_components/constraint-flow";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Create Constraint - Torus Portal",
    description:
      "Create custom constraints for the Torus Network. Define rules and conditions for network operations and governance.",
    keywords: [
      "create constraint",
      "network rules",
      "constraint management",
      "governance rules",
      "network conditions",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/constraints",
    baseUrl: env("BASE_URL"),
  });
}

export default function Page() {
  return (
    <main className="h-screen w-screen overflow-hidden md:py-12">
      {/* <ConstraintFlowWrapper /> */}
    </main>
  );
}
