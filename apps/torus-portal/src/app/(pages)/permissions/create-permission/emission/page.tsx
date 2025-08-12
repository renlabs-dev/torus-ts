import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import PortalFormContainer from "~/app/_components/portal-form-container";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { CreateEmissionPermissionForm } from "./_components/create-emission-permission-form";

export const metadata = () =>
  createSeoMetadata({
    title: "Create Emission Permission - Torus Portal",
    description:
      "Create emission permissions to control token distribution and rewards on the Torus Network. Manage network incentives and allocations.",
    keywords: [
      "emission permission",
      "token distribution",
      "network rewards",
      "permission management",
      "token allocation",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/permissions/create-permission/emission",
    baseUrl: env("BASE_URL"),
  });

export default function CreateEmissionPermissionPage() {
  return (
    <PortalFormContainer>
      <PortalFormHeader
        title="Create Emission Permission"
        description="Distribute emissions to a set of accounts."
      />
      <CreateEmissionPermissionForm />
    </PortalFormContainer>
  );
}
