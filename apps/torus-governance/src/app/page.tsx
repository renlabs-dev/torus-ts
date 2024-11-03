
import { BalanceSection } from "./components/balance-section";
import { Container } from "@torus-ts/ui";
import { FooterDivider } from "./components/footer-divider";
import { ListCards } from "./components/list-cards";
import { ProposalListHeader } from "./components/proposal-list-header";

export default function HomePage(): JSX.Element {
  return (
    <main className="flex flex-col items-center justify-center w-full">
      <div className="w-full h-full pt-12">
        <Container>
          <BalanceSection className="hidden lg:flex" />
          <ProposalListHeader />
          <ListCards />
          <FooterDivider />
        </Container>
      </div>
    </main>
  );
}
