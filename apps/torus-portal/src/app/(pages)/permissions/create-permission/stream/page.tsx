import { createSeoMetadata } from "@torus-ts/ui/components/seo";

import PortalFormContainer from "~/app/_components/portal-form-container";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { env } from "~/env";

import {
  CreateStreamPermissionForm,
} from "./_components/create-stream-permission-form";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Create Stream Permission - Torus Portal",
    description:
      "Enable economic coordination by delegating portions of your token emission streams to other agents.",
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
}

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
