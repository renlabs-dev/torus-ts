import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import PortalFormContainer from "~/app/_components/portal-form-container";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { env } from "~/env";
import { CreateStreamPermissionForm } from "./_components/create-stream-permission-form";

export const metadata = () =>
  createSeoMetadata({
    title: "Create Stream Permission - Torus Portal",
    description:
      "Create and configure stream permissions on the Torus Network. Distribute streams to multiple recipients with customizable allocation rules.",
    keywords: [
      "stream permission",
      "create permission",
      "stream allocation",
      "recipient distribution",
      "network streams",
      "permission management",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/permissions/create-permission/stream",
    baseUrl: env("BASE_URL"),
  });

export default function CreateStreamPermissionPage() {
  return (
    <PortalFormContainer>
      <PortalFormHeader
        title="Create Stream Permission"
        description="Distribute streams to a set of recipients."
      />
      <CreateStreamPermissionForm />
    </PortalFormContainer>
  );
}
