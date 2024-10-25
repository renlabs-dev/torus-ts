import ArrowRightIcon from "@heroicons/react/16/solid/ArrowRightIcon";

import { Card } from "./card";

export function CardSkeleton(): JSX.Element {
  return (
    <Card.Root>
      <Card.Header className="w-full flex-col md:flex-col-reverse">
        <p className="w-fit animate-pulse pb-2 text-center text-gray-300 md:pb-0 md:text-left">
          Loading Title...
        </p>
        <div className="mb-2 flex w-full flex-col justify-end gap-2 md:mb-0 md:ml-auto md:flex-row lg:w-6/12 lg:justify-end">
          <span className="w-full animate-pulse rounded-full border border-white/20 bg-white/5 py-1 text-center text-gray-300">
            Vote
          </span>
          <span className="w-full animate-pulse rounded-full border border-white/20 bg-white/5 py-1 text-center text-gray-300">
            Type
          </span>
          <span className="w-full animate-pulse rounded-full border border-white/20 bg-white/5 py-1 text-center text-gray-300">
            Subnet
          </span>
          <span className="w-full animate-pulse rounded-full border border-white/20 bg-white/5 py-1 text-center text-gray-300">
            Reward
          </span>
          <span className="w-full animate-pulse rounded-full border border-white/20 bg-white/5 py-1 text-center text-gray-300">
            Status
          </span>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="animate-pulse space-y-1 pb-2 text-gray-400 md:pb-6">
          <p>Proposal/S2 Application Body Loading...</p>
          <p>
            If you are seeing this, know that you are a important part of the
            community! and we are working hard to bring you the best experience.
          </p>
        </div>
      </Card.Body>
      <div className="flex w-full animate-pulse flex-col items-start justify-between border-t border-white/20 bg-[#898989]/5 p-2 backdrop-blur-md lg:flex-row lg:items-center lg:p-4">
        <div className="flex w-full flex-col-reverse md:w-fit lg:flex-row lg:items-center">
          <div className="mr-3 w-full py-2 lg:w-auto lg:min-w-fit lg:py-0">
            <div className="min-w-auto flex w-full items-center border border-white/10 px-2 py-4 text-sm text-white lg:w-auto lg:px-4">
              Loading full proposal
              <ArrowRightIcon className="ml-auto w-5 lg:ml-2" />
            </div>
          </div>
          <span className="line-clamp-1 block w-full truncate text-base text-white">
            Posted by{" "}
            <span className="text-green-500/80">Loading proposer</span>
          </span>
        </div>

        <div className="flex w-full justify-center gap-1 border border-white/10 px-2 py-4 text-center text-sm font-medium text-gray-300 lg:w-auto lg:px-4">
          Stake Voted:
          <span className="font-bold text-green-500">Loading...</span>
          <span className="font-bold text-yellow-500">(-%)</span>
        </div>
      </div>
    </Card.Root>
  );
}
