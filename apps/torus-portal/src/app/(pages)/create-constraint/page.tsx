import PortalNavigationTabs from "~/app/_components/portal-navigation-tabs";
// import ConstraintFlowWrapper from "./_components/constraint-flow";

export default function Page() {
  return (
    <main className="w-screen h-screen overflow-hidden md:py-12">
      <div className="absolute top-[3.9rem] left-2 right-96 z-10">
        <PortalNavigationTabs />
      </div>
      {/* <ConstraintFlowWrapper /> */}
    </main>
  );
}
