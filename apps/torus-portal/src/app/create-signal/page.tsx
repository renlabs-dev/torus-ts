import PortalFormLayout from "../_components/portal-form-layout";
import CreateSignalForm from "./_components/create-signal-form";

export default function Page() {
  return (
    <PortalFormLayout 
      imageSrc="/form-bg-signal.svg"
      imageAlt="Abstract decorative background illustrating signal creation"
    >
      <CreateSignalForm />
    </PortalFormLayout>
  );
}
