import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import PortalFormContainer from "~/app/_components/portal-form-container";

import { CreateSignalForm } from "./_components/create-signal-form";

export const metadata = createSeoMetadata({
  title: "Create Signal - Torus Portal",
  description: "Create demand signals on the Torus Network. Signal network needs and requirements to guide resource allocation.",
  keywords: ["create signal", "demand signal", "network signals", "resource signaling", "network requirements"],
  ogSiteName: "Torus Portal",
  canonical: "/signals/create-signal",
  baseUrl: env("BASE_URL"),
});

export default function CreateSignalFormPage() {
  return (
    <PortalFormContainer>
      <CreateSignalForm />
    </PortalFormContainer>
  );
}
