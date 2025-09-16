import { createSeoMetadata } from "@torus-ts/ui/components/seo";

import PortalFormContainer from "~/app/_components/portal-form-container";
import { env } from "~/env";

import { ManageAgentForm } from "./_components/manage-agent-form";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Manage Agent - Torus Portal",
    description: "Update agent information and deregister agents.",
    keywords: [
      "manage agent",
      "agent operations",
      "network management",
      "agent deregistration",
      "agent updates",
      "network operations",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/network-operations/manage-agent",
    baseUrl: env("BASE_URL"),
  });
}

export default function ManageAgentPage() {
  return (
    <PortalFormContainer>
      <ManageAgentForm />
    </PortalFormContainer>
  );
}
