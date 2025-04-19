import { Button } from "@torus-ts/ui/components/button";
import { Container } from "@torus-ts/ui/components/container";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AgentApplicationExpandedView } from "./_components/agent-application-expanded-view";

export default async function AgentApplicationView({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  if (!id) {
    return <div>Not Found</div>;
  }

  return (
    <Container>
      <div className="mx-auto flex w-full max-w-screen-xl flex-col pb-20">
        <Button
          asChild
          variant="link"
          className="mb-6 flex w-fit items-center gap-1.5 p-0"
        >
          <Link
            href="/?view=agent-applications"
            className="animate-fade-left flex items-center text-white transition duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Go back to agents/modules list
          </Link>
        </Button>

        <div
          className="flex h-full w-full flex-col justify-between divide-gray-500 text-white
            lg:flex-row"
        >
          <AgentApplicationExpandedView paramId={Number(id)} />
        </div>
      </div>
    </Container>
  );
}
