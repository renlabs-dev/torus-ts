import { AgentApplicationExpandedView } from "./_components/agent-application-expanded-view";
import { Button } from "@torus-ts/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AgentApplicationView({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>): Promise<JSX.Element> {
  const { id } = await params;

  if (!id) {
    return <div>Not Found</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-col pb-20">
      <Button
        asChild
        variant="link"
        className="mb-6 flex w-fit items-center gap-1.5 p-0"
      >
        <Link
          href="/?view=agent-applications"
          className="flex animate-fade-left items-center text-white transition duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          Go back to agents/modules list
        </Link>
      </Button>

      <div className="flex h-full w-full flex-col justify-between divide-gray-500 text-white lg:flex-row">
        <AgentApplicationExpandedView paramId={Number(id)} />
      </div>
    </div>
  );
}
