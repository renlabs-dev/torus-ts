import { createSeoMetadata } from "@torus-ts/ui/components/seo";

import PortalFormContainer from "~/app/_components/portal-form-container";
import { env } from "~/env";

import { RegisterAgentForm } from "./_components/register-agent-form";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Register Agent - Torus Portal",
    description: "Register a new agents.",
    keywords: [
      "register agent",
      "agent registration",
      "network participation",
      "validator registration",
      "network onboarding",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/network-operations/register-agent",
    baseUrl: env("BASE_URL"),
  });
}

export default function RegisterAgentFormPage() {
  return (
    <PortalFormContainer>
      <RegisterAgentForm />
    </PortalFormContainer>
  );
}
