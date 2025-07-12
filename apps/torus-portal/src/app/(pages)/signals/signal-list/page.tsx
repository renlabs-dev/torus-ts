import PortalFormContainer from "~/app/_components/portal-form-container";

import AllSignalsView from "./_components/all-signals-view";

export default function Page() {
  return (
    <PortalFormContainer>
      <div className="w-full max-w-4xl mx-auto px-4 pt-6 md:pt-0">
        <AllSignalsView />
      </div>
    </PortalFormContainer>
  );
}
