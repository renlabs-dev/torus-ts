import { ChevronsUp } from "lucide-react";

export const VotesDisplay = ({ upVotes, downVotes, className }: { upVotes?: string | number, downVotes?: string | number, className?: string }) => {
  return (
    <div className={`flex items-center justify-center w-full px-3 py-2 space-x-0 text-sm text-center border divide-x divide-white/10 border-white/10 lg:w-auto ${className ?? ""}`}>
      <div className="flex gap-2 pr-1.5 items-center justify-center">
        <ChevronsUp className="fill-green-500" height={16} />
        <span className="text-green-500">{upVotes ?? "-"}</span>
      </div>
      <div className="flex gap-2 pl-1.5 items-center justify-center">
        <span className="text-red-500">{downVotes ?? "-"}</span>
        <ChevronsUp className="fill-red-500 rotate-180" height={16} />
      </div>
    </div>
  );
}