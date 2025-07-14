import { AllocatorAgentItem } from "@torus-ts/ui/components/allocator-agent-item";

import type { RegisterAgentFormData } from "./register-agent-schema";

interface RegisterAgentPreviewProps {
  formValues: RegisterAgentFormData;
}

export function RegisterAgentPreview({
  formValues,
}: RegisterAgentPreviewProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex w-fit flex-col gap-2 lg:w-full">
        <AllocatorAgentItem
          shouldHideAllocation
          agentKey={formValues.agentKey}
          iconUrl={
            formValues.icon ? URL.createObjectURL(formValues.icon) : null
          }
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
      </div>
    </div>
  );
}
