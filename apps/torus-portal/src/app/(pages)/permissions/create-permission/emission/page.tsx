import PortalFormContainer from "~/app/_components/portal-form-container";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { CreateEmissionPermissionForm } from "./_components/create-emission-permission-form";

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
