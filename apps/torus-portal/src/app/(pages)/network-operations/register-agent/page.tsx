import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import PortalFormContainer from "~/app/_components/portal-form-container";

import { RegisterAgentForm } from "./_components/register-agent-form";

export const metadata = createSeoMetadata({
  title: "Register Agent - Torus Portal",
  description: "Register a new agent on the Torus Network. Join the decentralized network as a validator or service provider.",
  keywords: ["register agent", "agent registration", "network participation", "validator registration", "network onboarding"],
  ogSiteName: "Torus Portal",
  canonical: "/network-operations/register-agent",
  baseUrl: env("BASE_URL"),
});

export default function RegisterAgentFormPage() {
  return (
    <PortalFormContainer>
      <RegisterAgentForm />
    </PortalFormContainer>
  );
}
