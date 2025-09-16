import { createSeoMetadata } from "@torus-ts/ui/components/seo";

import PortalFormContainer from "~/app/_components/portal-form-container";
import { env } from "~/env";

import { RegisterCapabilityForm } from "./_components/create-capability-form";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Register Capability - Torus Portal",
    description: "Register a capability for agents.",
    keywords: [
      "register capability",
      "agent permissions",
      "configure capability",
      "access control",
      "permission registration",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/capabilities/register-capability",
    baseUrl: env("BASE_URL"),
  });
}

export default function RegisterCapabilityPage() {
  return (
    <PortalFormContainer>
      <RegisterCapabilityForm />
    </PortalFormContainer>
  );
}
