// import { BalanceSection } from "./components/balance-section";
// import { Container } from "@torus-ts/ui";
// import { FooterDivider } from "./components/footer-divider";
import { ListCards } from "./components/list-cards";
// import { ProposalListHeader } from "./components/proposal-list-header";
import { Sidebar } from "./components/sidebar";

export default function HomePage(): JSX.Element {
  return (
    <main className="flex w-full flex-col items-center justify-center">
      <div className="h-full w-full pt-12">
        {/* <Container> */}
        <div className="mx-auto flex w-full max-w-screen-xl animate-fade-in-down flex-col items-center justify-center text-white">
          <div className="flex w-full justify-center gap-4 pb-12 pt-24">
            <Sidebar />
            <div className="w-full">
              <ListCards />
            </div>
          </div>
        </div>
        {/* <BalanceSection className="hidden lg:flex" /> */}
        {/* <ProposalListHeader /> */}
        {/* <FooterDivider /> */}
        {/* </Container> */}
      </div>
    </main>
  );
}
