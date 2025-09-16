import { createSeoMetadata } from "@torus-ts/ui/components/seo";

import PortalFormContainer from "~/app/_components/portal-form-container";
import { env } from "~/env";

import { CreateSignalForm } from "./_components/create-signal-form";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Create Signal - Torus Portal",
    description:
      "Allows you to delegate part of your emissions to agents who can provide specialized capabilities, potentially increasing your overall rewards while reducing your workload.",
    keywords: [
      "create signal",
      "demand signal",
      "network signals",
      "resource signaling",
      "network requirements",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/signals/create-signal",
    baseUrl: env("BASE_URL"),
  });
}

export default function CreateSignalFormPage() {
  return (
    <PortalFormContainer>
      <CreateSignalForm />
    </PortalFormContainer>
  );
}
