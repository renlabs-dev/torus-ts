import { Button } from "@torus-ts/ui";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProposalExpandedView } from "./_components/proposal-expanded-view";

export default async function ProposalView({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
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
          href="/?view=proposals"
          className="flex animate-fade-left items-center text-white transition duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          Go back to agents list
        </Link>
      </Button>

      <div className="flex h-full w-full flex-col justify-between divide-gray-500 text-white lg:flex-row">
        <ProposalExpandedView paramId={Number(id)} />
      </div>
    </div>
  );
}
