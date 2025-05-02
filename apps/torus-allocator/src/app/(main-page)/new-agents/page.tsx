import { parseSearchParams } from "~/utils/parse-search-params";
import { AgentList } from "../../_components/agent-list";
import { PageLayout } from "../../_components/page-layout";

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
