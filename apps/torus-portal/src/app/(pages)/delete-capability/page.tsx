import PortalFormContainer from "~/app/_components/portal-form-container";
import DeleteNamespaceForm from "./_components/delete-namespace-form";

export default function DeleteCapabilityPage() {
  return (
    <PortalFormContainer imageSrc="/form-bg-register-capability.svg">
      <DeleteNamespaceForm />
    </PortalFormContainer>
  );
}
