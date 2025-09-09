import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import PortalFormContainer from "~/app/_components/portal-form-container";
import { env } from "~/env";
import { ManageAgentForm } from "./_components/manage-agent-form";

export const metadata = () =>
  createSeoMetadata({
    title: "Manage Agent - Torus Portal",
    description:
      "Manage network agents on the Torus Network. Update agent information, deregister agents, and perform network operations.",
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

export default function ManageAgentPage() {
  return (
    <PortalFormContainer>
      <ManageAgentForm />
    </PortalFormContainer>
  );
}
