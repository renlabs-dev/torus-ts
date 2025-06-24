import PortalFormContainer from "~/app/_components/portal-form-container";
import DeleteNamespaceForm from "./_components/delete-namespace-form";

export default function DeleteNamespacePage() {
  return (
    <PortalFormContainer imageSrc="/form-bg-create-namespace.svg">
      <DeleteNamespaceForm />
    </PortalFormContainer>
  );
}
