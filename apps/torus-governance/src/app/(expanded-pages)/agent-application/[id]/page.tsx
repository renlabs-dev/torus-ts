import { Button } from "@torus-ts/ui/components/button";
import { Container } from "@torus-ts/ui/components/container";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { ArrowLeft, ExternalLink } from "lucide-react";
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
      <div className="animate-fade mx-auto flex w-full max-w-screen-xl flex-col pb-20">
        <div className="mb-6 items-center justify-between md:flex">
          <Button
            asChild
            variant="link"
            className="flex w-fit items-center gap-1.5 p-0"
          >
            <Link
              href="/whitelist-applications"
              className="animate-fade-left flex items-center text-white transition duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              Go back to whitelist applications list
            </Link>
          </Button>
          <CopyButton
            copy={id}
            variant="link"
            className="animate-fade-left hidden items-center text-white transition duration-200 md:flex"
          >
            <ExternalLink className="h-5 w-5" />
            Propagate this application
          </CopyButton>
        </div>
        <div className="flex h-full w-full flex-col justify-between divide-gray-500 text-white lg:flex-row">
          <AgentApplicationExpandedView paramId={Number(id)} />
        </div>
      </div>
    </Container>
  );
}
