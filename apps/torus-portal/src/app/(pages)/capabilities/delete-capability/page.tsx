import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import PortalFormContainer from "~/app/_components/portal-form-container";

import { DeleteCapabilityForm } from "./_components/delete-capability-form";

export const metadata = createSeoMetadata({
  title: "Delete Capability - Torus Portal",
  description: "Remove capabilities from agents on the Torus Network. Manage and revoke permissions for network participants.",
  keywords: ["delete capability", "revoke permissions", "capability management", "permission removal", "access control"],
  ogSiteName: "Torus Portal",
  canonical: "/capabilities/delete-capability",
  baseUrl: env("BASE_URL"),
});

export default function DeleteCapabilityPage() {
  return (
    <PortalFormContainer>
      <DeleteCapabilityForm />
    </PortalFormContainer>
  );
}
