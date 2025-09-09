import PortalFormContainer from "~/app/_components/portal-form-container";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { CreateStreamPermissionForm } from "./_components/create-stream-permission-form";

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
