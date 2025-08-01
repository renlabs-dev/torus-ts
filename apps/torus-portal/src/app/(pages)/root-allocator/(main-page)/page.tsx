import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { parseSearchParams } from "~/utils/parse-search-params";

import { AgentList } from "../_components/agent-list";
import { PageLayout } from "../_components/page-layout";

export const metadata = createSeoMetadata({
  title: "Root Allocator - Torus Portal",
  description: "Manage agent allocations and weights on the Torus Network. View and allocate resources to network participants.",
  keywords: ["root allocator", "agent allocation", "weight allocation", "resource management", "network allocation"],
  ogSiteName: "Torus Portal",
  canonical: "/root-allocator",
  baseUrl: env("BASE_URL"),
});

export default async function Page(props: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    isWhitelisted?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { page, search } = parseSearchParams(searchParams);
  const isWhitelisted = searchParams.isWhitelisted !== "false";

  return (
    <PageLayout search={search}>
      <AgentList page={page} search={search} isWhitelisted={isWhitelisted} />
    </PageLayout>
  );
}
