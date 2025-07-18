import { parseSearchParams } from "~/utils/parse-search-params";
import { AgentList } from "../_components/agent-list";
import { PageLayout } from "../_components/page-layout";

export default async function Page(props: {
  searchParams: Promise<{ page?: string; search?: string; isWhitelisted?: string }>;
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
