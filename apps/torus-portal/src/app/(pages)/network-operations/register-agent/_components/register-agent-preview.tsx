import { AllocatorAgentItem } from "@torus-ts/ui/components/allocator-agent-item";

import type { RegisterAgentFormData } from "./register-agent-schema";

interface RegisterAgentPreviewProps {
  formValues: RegisterAgentFormData;
}

export function RegisterAgentPreview({
  formValues,
}: RegisterAgentPreviewProps) {
  return (
    <AllocatorAgentItem
      shouldHideAllocation
      agentKey={formValues.agentKey}
      iconUrl={formValues.icon ? URL.createObjectURL(formValues.icon) : null}
      socialsList={{
        discord: formValues.discord,
        github: formValues.github,
        telegram: formValues.telegram,
        twitter: formValues.twitter,
        website: formValues.website,
      }}
      shortDescription={
        formValues.shortDescription === ""
          ? "Fill in the short description field"
          : formValues.shortDescription
      }
      currentBlock={5000}
      title={
        formValues.name === "" ? "fill-in-the-name-field" : formValues.name
      }
    />
  );
}
