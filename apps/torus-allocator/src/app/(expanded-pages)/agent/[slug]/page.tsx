import { AgentInfoCard } from "~/app/components/agent-info-card";
import { api } from "~/trpc/server";
import { ArrowLeft, Globe } from "lucide-react";
import { Button, Container, Icons } from "@torus-ts/ui";
import { ExpandedViewContent } from "~/app/components/expanded-view-content";
import { fetchAgentMetadata } from "@torus-ts/subspace";
import { notFound } from "next/navigation";
import Link from "next/link";
import BlobImage from "~/app/components/blob-image";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<JSX.Element> {
  const { slug } = await params;

  if (!slug) {
    return <div>Not Found</div>;
  }

  const agentKey = slug;

  const mdl = await api.agent.byKeyLastBlock({ key: agentKey });

  if (!mdl) {
    notFound();
  }

  if (!mdl.metadataUri) {
    notFound();
  }

  let metadata;
  let images;

  try {
    const r = await fetchAgentMetadata(mdl.metadataUri, {
      fetchImages: true,
    });
    metadata = r.metadata;
    images = r.images;
  } catch (e) {
    console.error(e);
    notFound();
  }
  console.log(metadata);
  // Blob URL for the icon
  const icon = images.icon;
  console.log(icon);

  const _socialList = [
    {
      name: "Discord",
      href: metadata.socials?.discord ?? null,
      icon: (
        <Icons.discord className="h-4 w-4 md:h-3.5 md:w-3.5" color="gray" />
      ),
    },
    {
      name: "X",
      href: metadata.socials?.twitter ?? null,
      icon: <Icons.x className="h-4 w-4 md:h-3.5 md:w-3.5" color="gray" />,
    },
    {
      name: "GitHub",
      href: metadata.socials?.github ?? null,
      icon: <Icons.github className="h-4 w-4 md:h-3.5 md:w-3.5" color="gray" />,
    },
    {
      name: "Telegram",
      href: metadata.socials?.telegram ?? null,
      icon: (
        <Icons.telegram className="h-4 w-4 md:h-3.5 md:w-3.5" color="gray" />
      ),
    },
    {
      name: "Website",
      href: metadata.website ?? null,
      icon: <Globe className="h-4 w-4 md:h-3.5 md:w-3.5" color="gray" />,
    },
  ];

  return (
    <Container>
      <div className="mx-auto min-h-[calc(100vh-169px)] text-white">
        <Button
          asChild
          variant="link"
          className="flex w-fit items-center gap-1.5 p-0"
        >
          <Link
            href="/?view=agents"
            className="flex animate-fade-left items-center text-white transition duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Go back to agents list
          </Link>
        </Button>

        {icon && (
          <BlobImage blob={icon} alt="My Blob Image" width={400} height={300} />
        )}

        <div className="mb-6 mt-10 flex w-full">
          <h1 className="flex-grow animate-fade-right text-start text-3xl font-semibold">
            {mdl.name}
          </h1>
        </div>
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="mb-12 flex animate-fade-down flex-col gap-6 animate-delay-500 md:w-2/3">
            <ExpandedViewContent content={metadata.description} />
          </div>
          <div className="flex animate-fade-down flex-col gap-6 animate-delay-500 md:w-1/3">
            <AgentInfoCard agent={mdl} />
          </div>
        </div>
      </div>
    </Container>
  );
}
