import { Container } from "@torus-ts/ui";

import { BalanceSection } from "./components/balance-section";
import { FooterDivider } from "./components/footer-divider";
import { ProposalListHeader } from "./components/proposal-list-header";
import { ListCards } from "./components/list-cards";

export default function HomePage(): JSX.Element {

  return (
    <main className="flex w-full flex-col items-center justify-center">
      <div className="h-full w-full bg-repeat">
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
