import PortalFormContainer from "~/app/_components/portal-form-container";
import RegisterAgentForm from "./_components/register-agent-form";

export default function Page() {
  return (
    <PortalFormContainer imageSrc="/form-bg-agent.svg">
      <RegisterAgentForm />
    </PortalFormContainer>
  );
}