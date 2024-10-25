import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { CadreSectionContainer, CadreMembersList, CadreRequestsList } from "./_components";

export default function CadrePage() {
  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col px-4">
      <Link
        className="my-6 ml-2 flex w-fit animate-fade-down items-center justify-center gap-2 border border-white/20 bg-[#898989]/5 px-5 py-3 text-gray-400 backdrop-blur-md transition duration-200 hover:border-green-500 hover:bg-green-500/20 hover:text-green-500"
        href="/"
      >
        <ArrowLeftIcon className="h-6 text-green-500" />
        Go Back to Proposals List
      </Link>

      <CadreSectionContainer>
        <div className="mb-4 w-full border-b border-gray-500 border-white/20 pb-1 text-gray-400">
          <h2 className="text-start text-lg font-semibold text-gray-300">Cadre Requests</h2>
        </div>
        <CadreRequestsList />
      </CadreSectionContainer >

      <CadreSectionContainer>
        <div className="mb-4 w-full border-b border-gray-500 border-white/20 pb-1 text-gray-400">
          <h2 className="text-start text-lg font-semibold text-gray-300">Cadre Members Discord Id's</h2>
        </div>
        <CadreMembersList />
      </CadreSectionContainer>
    </div>
  )
}

