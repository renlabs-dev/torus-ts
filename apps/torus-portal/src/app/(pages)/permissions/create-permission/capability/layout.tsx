import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Create Capability Permission - Torus Portal",
    description:
      "Allow you to recursively delegate access, either from your own agent or from an agent that has granted you access, so you can hold and redelegate their permissions, endpoints, and services to other agents..",
    keywords: [
      "capability permission",
      "agent capabilities",
      "permission creation",
      "access rights",
      "operational permissions",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/permissions/create-permission/capability",
    baseUrl: env("BASE_URL"),
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
