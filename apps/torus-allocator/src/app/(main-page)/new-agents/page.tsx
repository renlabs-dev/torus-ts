import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { parseSearchParams } from "~/utils/parse-search-params";
import { AgentList } from "../../_components/agent-list";
import { PageLayout } from "../../_components/page-layout";
import { env } from "~/env";

export const metadata = () =>
  createSeoMetadata({
    title: "New Agents - Torus Allocator",
    description: "Discover newly registered agents on the Torus Network. Be the first to delegate your stake to promising new agents and support innovation.",
    keywords: ["torus new agents", "torus network", "new blockchain agents", "stake delegation", "latest torus agents"],
    baseUrl: env("BASE_URL"),
    canonical: "/new-agents",
  });

export default async function Page(props: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { page, search } = parseSearchParams(searchParams);

  return (
    <PageLayout search={search}>
      <AgentList page={page} search={search} orderBy="createdAt.desc" />
    </PageLayout>
  );
}
