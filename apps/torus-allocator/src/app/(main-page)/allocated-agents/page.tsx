import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { AllocatedAgentsClient } from "~/app/_components/allocated-agents-client";

export const metadata = () =>
  createSeoMetadata({
    title: "My Allocated Agents - Torus Allocator",
    description:
      "View and manage your agent allocations on the Torus Network. Optimize your stake distribution and track your delegation performance.",
    keywords: [
      "torus allocator",
      "torus network",
      "my allocated agents",
      "stake delegation",
      "agent management",
    ],
    baseUrl: env("BASE_URL"),
    canonical: "/allocated-agents",
  });

export default function AllocatedAgentsPage() {
  return <AllocatedAgentsClient />;
}
