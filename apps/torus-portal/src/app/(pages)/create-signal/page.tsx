import PortalFormContainer from "~/app/_components/portal-form-container";
import CreateSignalForm from "./_components/create-signal-form";

export default function Page() {
  return (
    <PortalFormContainer
      imageSrc="/form-bg-signal.svg"
      imageAlt="Abstract decorative background illustrating signal creation"
    >
      <CreateSignalForm />
    </PortalFormContainer>
  );
}
