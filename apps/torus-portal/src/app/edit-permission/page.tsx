import type { Metadata } from "next";
import PortalFormLayout from "../_components/portal-form-layout";
import EditEmissionPermissionForm from "./_components/edit-emission-permission-form";

export const metadata: Metadata = {
  title: "Edit Permission | Torus Portal",
  description: "Edit existing emission permissions on the Torus Network",
};

export default function EditPermissionPage() {
  return (
    <PortalFormLayout
      imageSrc="/form-bg-permission-edit.svg"
      imageAlt="Abstract decorative background illustrating permission editing"
    >
      <EditEmissionPermissionForm />
    </PortalFormLayout>
  );
}
