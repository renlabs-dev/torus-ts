import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { parseSearchParams } from "~/utils/parse-search-params";

import { AgentList } from "../../_components/agent-list";
import { PageLayout } from "../../_components/page-layout";

export const metadata = createSeoMetadata({
  title: "New Agents - Torus Portal",
  description: "Discover newly registered agents on the Torus Network. Explore and allocate to the latest network participants.",
  keywords: ["new agents", "recent agents", "agent discovery", "latest registrations", "network participants"],
  ogSiteName: "Torus Portal",
  canonical: "/root-allocator/new-agents",
  baseUrl: env("BASE_URL"),
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
