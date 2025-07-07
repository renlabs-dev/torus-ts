import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";

import PortalFormContainer from "~/app/_components/portal-form-container";

import AllSignalsView from "./_components/all-signals-view";
import CreateSignalForm from "./_components/create-signal-form";

export default function Page() {
  return (
    <PortalFormContainer imageSrc="/form-bg-signal.svg">
      <div className="w-full max-w-4xl mx-auto px-4 pt-6 md:pt-0">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Signal</TabsTrigger>
            <TabsTrigger value="view">All Signals</TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="mt-6">
            <CreateSignalForm />
          </TabsContent>
          <TabsContent value="view" className="mt-6">
            <AllSignalsView />
          </TabsContent>
        </Tabs>
      </div>
    </PortalFormContainer>
  );
}
