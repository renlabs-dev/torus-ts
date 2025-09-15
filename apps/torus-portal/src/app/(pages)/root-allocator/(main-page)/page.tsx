import { parseSearchParams } from "~/utils/parse-search-params";
import type { AgentView } from "../_components/agent-view-toggle";
import { InfiniteAgentList } from "../_components/infinite-agent-list";
import { PageLayout } from "../_components/page-layout";

export function generateMetadata() {
  return import("./layout").then((module) => module.generateMetadata());
}

export default async function Page(props: {
  searchParams: Promise<{
    search?: string;
    view?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { search } = parseSearchParams(searchParams);

  const view = searchParams.view ?? "all";

  const getListProps = () => {
    switch (view) {
      case "root":
        return { isWhitelisted: true };
      case "new":
        return { orderBy: "createdAt.desc" as const };
      case "oldest":
        return { orderBy: "createdAt.asc" as const };
      case "all":
      default:
        return {};
    }
  };

  return (
    <PageLayout search={search} currentView={view as AgentView}>
      <InfiniteAgentList search={search} {...getListProps()} />
    </PageLayout>
  );
}
