import { parseSearchParams } from "~/utils/parse-search-params";

import { InfiniteAgentList } from "../_components/infinite-agent-list";
import { PageLayout } from "../_components/page-layout";

export default async function Page(props: {
  searchParams: Promise<{
    search?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { search } = parseSearchParams(searchParams);

  return (
    <PageLayout search={search}>
      <InfiniteAgentList search={search} />
    </PageLayout>
  );
}
