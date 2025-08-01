import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import PortalFormContainer from "~/app/_components/portal-form-container";

import { CreateCapabilityForm } from "./_components/create-capability-form";

export const metadata = createSeoMetadata({
  title: "Create Capability - Torus Portal",
  description: "Create new capabilities for agents on the Torus Network. Define permissions and access controls for network participants.",
  keywords: ["create capability", "agent permissions", "access control", "capability management", "network permissions"],
  ogSiteName: "Torus Portal",
  canonical: "/capabilities/create-capability",
  baseUrl: env("BASE_URL"),
});

export default function CreateSignalFormPage() {
  return (
    <PortalFormContainer>
      <CreateCapabilityForm />
    </PortalFormContainer>
  );
}
