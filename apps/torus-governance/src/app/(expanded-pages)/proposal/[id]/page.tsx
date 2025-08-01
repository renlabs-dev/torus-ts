import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { Button } from "@torus-ts/ui/components/button";
import { Container } from "@torus-ts/ui/components/container";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProposalExpandedView } from "./_components/proposal-expanded-view";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return createSeoMetadata({
    title: `Proposal #${id} - Torus Governance`,
    description: `View proposal #${id} details, voting results, and community discussion on the Torus Network governance platform.`,
    keywords: ["network proposal", "proposal details", "governance voting", "proposal discussion"],
    ogSiteName: "Torus Governance",
    canonical: `/proposal/${id}`,
    baseUrl: env("BASE_URL"),
  });
}

export default async function ProposalView({
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
            href="/proposals"
            className="animate-fade-left flex items-center text-white transition duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Go back to agents list
          </Link>
        </Button>

        <div
          className="flex h-full w-full flex-col justify-between divide-gray-500 text-white
            lg:flex-row"
        >
          <ProposalExpandedView paramId={Number(id)} />
        </div>
      </div>
    </Container>
  );
}
