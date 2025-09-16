import { createSeoMetadata } from "@torus-ts/ui/components/seo";

import PortalFormContainer from "~/app/_components/portal-form-container";
import { env } from "~/env";

import { EditPermissionForm } from "./_components/edit-permission-form";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Manage Permission - Torus Portal",
    description: "Edit existing permissions settings.",
    keywords: [
      "edit permission",
      "modify permission",
      "permission settings",
      "access control",
      "permission management",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/permissions/manage-permission",
    baseUrl: env("BASE_URL"),
  });
}

export default function EditPermissionFormPage() {
  return (
    <PortalFormContainer>
      <EditPermissionForm />
    </PortalFormContainer>
  );
}
