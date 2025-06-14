import { api } from "~/trpc/react";
import PortalNavigationTabs from "../_components/portal-navigation-tabs";

export default function Page() {
  const createApplicationVoteMutation = api.signal.create.useMutation();
  return (
    <main className="min-h-screen overflow-auto bg-background">
      <div className="fixed top-[3.9rem] left-2 right-96 z-10">
        <PortalNavigationTabs />
      </div>
      <div className="pt-24 pb-12">x</div>
    </main>
  );
}
