import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import PortalFormContainer from "~/app/_components/portal-form-container";
import { env } from "~/env";
import { DeleteCapabilityForm } from "./_components/delete-capability-form";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Delete Capability - Torus Portal",
    description: "Remove capabilities from agents.",
    keywords: [
      "delete capability",
      "revoke permissions",
      "capability management",
      "permission removal",
      "access control",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/capabilities/delete-capability",
    baseUrl: env("BASE_URL"),
  });
}

export default function DeleteCapabilityPage() {
  return (
    <PortalFormContainer>
      <DeleteCapabilityForm />
    </PortalFormContainer>
  );
}
