
// import { BalanceSection } from "./components/balance-section";
// import { Container } from "@torus-ts/ui";
// import { FooterDivider } from "./components/footer-divider";
import { ListCards } from "./components/list-cards";
// import { ProposalListHeader } from "./components/proposal-list-header";
import { Sidebar } from "./components/sidebar";

export default function HomePage(): JSX.Element {



  return (
    <main className="flex flex-col items-center justify-center w-full">
      <div className="w-full h-full pt-12">
        {/* <Container> */}
        <div className="flex flex-col items-center justify-center w-full max-w-screen-xl mx-auto text-white animate-fade-in-down">
          <div className="flex justify-center w-full gap-4 pt-24 pb-12">
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
