import Link from "next/link";
import { ProposalExpandedView } from "./_components/proposal-expanded-view";
import { ArrowLeft } from "lucide-react";

export default function CardView({
  params,
}: {
  params: { id: string };
}): JSX.Element {
  if (!params.id) {
    return <div>Not Found</div>;
  }

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col px-4">
      <Link
        className="my-6 ml-2 flex w-fit animate-fade-down items-center justify-center gap-2 border border-white/20 bg-[#898989]/5 px-5 py-3 text-gray-400 backdrop-blur-md transition duration-200 hover:border-green-500 hover:bg-green-500/20 hover:text-green-500"
        href="/"
      >
        <ArrowLeft className="h-6 text-green-500" />
        Go Back to Proposals List
      </Link>
      <div className="mb-6 flex h-full w-full flex-col justify-between divide-gray-500 text-white md:mb-12 lg:flex-row">
        <ProposalExpandedView paramId={Number(params.id)} />
      </div>
    </div>
  );
}
