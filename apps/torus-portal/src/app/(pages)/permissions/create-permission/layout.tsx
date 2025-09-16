import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import PortalFormContainer from "~/app/_components/portal-form-container";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { env } from "~/env";
import { CreatePermissionTabs } from "./_components/create-permission-tabs";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Create Permission - Torus Portal",
    description:
      "Create and delegate permissions on the Torus Network. Choose between capability and emission permissions for network participants.",
    keywords: [
      "create permission",
      "delegate permission",
      "capability permission",
      "emission permission",
      "permission management",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/permissions/create-permission",
    baseUrl: env("BASE_URL"),
  });
}

// Every single namespace name has been changed to Capability Permission
// as requested here: https://coda.io/d/RENLABS-CORE-DEVELOPMENT-DOCUMENTS_d5Vgr5OavNK/Text-change-requests_su4jQAlx
// In the future we are going to have all the other names from namespace to Capability Permission
// TODO : Change all namespace to Capability Permission

interface CreatePermissionLayoutProps {
  children: React.ReactNode;
}

export default function CreatePermissionLayout({
  children,
}: CreatePermissionLayoutProps) {
  return (
    <PortalFormContainer>
      <PortalFormHeader
        title="Delegate Permission"
        description="Select the type of permission you want to delegate."
      />
      <CreatePermissionTabs>{children}</CreatePermissionTabs>
    </PortalFormContainer>
  );
}
