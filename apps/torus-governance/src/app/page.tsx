import { Container } from "@torus-ts/ui";

import { BalanceSection } from "./components/balance-section";
import { FooterDivider } from "./components/footer-divider";
import { ListCards } from "./components/list-cards";
import { ProposalListHeader } from "./components/proposal-list-header";

export default function HomePage(): JSX.Element {
  return (
    <main className="flex w-full flex-col items-center justify-center">
      <div className="h-full w-full pt-12">
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
