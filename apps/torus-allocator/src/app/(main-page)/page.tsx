import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { parseSearchParams } from "~/utils/parse-search-params";
import { AgentList } from "../_components/agent-list";
import { PageLayout } from "../_components/page-layout";
import { env } from "~/env";

export const metadata = () =>
  createSeoMetadata({
    title: "Torus Allocator - Delegate Stake to Agents",
    description: "Discover and allocate your stake to Torus Network agents. Participate in the decentralized reward system and help shape the Torus ecosystem.",
    keywords: ["torus allocator", "torus network", "stake delegation", "torus agents", "agent allocation"],
    baseUrl: env("BASE_URL"),
    canonical: "/",
  });

export default async function Page(props: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { page, search } = parseSearchParams(searchParams);

  return (
    <PageLayout search={search}>
      <AgentList page={page} search={search} />
    </PageLayout>
  );
}
