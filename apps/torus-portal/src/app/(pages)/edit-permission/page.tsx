import type { Metadata } from "next";

import PortalFormContainer from "~/app/_components/portal-form-container";

import EditEmissionPermissionForm from "./_components/edit-emission-permission-form";

export const metadata: Metadata = {
  title: "Edit/Revoke Permission | Torus Portal",
  description: "Edit existing permissions on Torus",
};

export default function EditPermissionPage() {
  return (
    <PortalFormContainer imageSrc="/form-bg-permission-edit.svg">
      <EditEmissionPermissionForm />
    </PortalFormContainer>
  );
}
