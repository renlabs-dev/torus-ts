import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import PortalFormContainer from "~/app/_components/portal-form-container";

import { EditPermissionForm } from "./_components/edit-permission-form";

export const metadata = createSeoMetadata({
  title: "Edit Permission - Torus Portal",
  description: "Edit existing permissions on the Torus Network. Modify permission settings and access controls for network participants.",
  keywords: ["edit permission", "modify permission", "permission settings", "access control", "permission management"],
  ogSiteName: "Torus Portal",
  canonical: "/permissions/edit-permission",
  baseUrl: env("BASE_URL"),
});

export default function EditPermissionFormPage() {
  return (
    <PortalFormContainer>
      <EditPermissionForm />
    </PortalFormContainer>
  );
}
