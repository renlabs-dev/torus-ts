import { SectionHeaderText } from "./section-header-text";

export function GovernanceStatusNotOpen({
  statusText,
  governanceModel,
}: {
  statusText: string;
  governanceModel: "PROPOSAL" | "DAO";
}) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="border border-white/20 bg-[#898989]/5 bg-opacity-80 px-4 py-2 shadow-md">
          <span className="font-semibold text-white">
            This {governanceModel} is {statusText}.
          </span>
        </div>
      </div>

      <div className="relative z-0 opacity-10">
        <SectionHeaderText text="Cast your vote" />
        <div>
          <div className="flex w-full gap-4">
            <button
              className={`w-full border border-green-500 py-1 text-green-500`}
              disabled={true}
            >
              Approve
            </button>
            <button
              className={`w-full border border-red-500 py-1 text-red-500`}
              disabled={true}
            >
              Refuse
            </button>
          </div>
          <button className={`mt-4 w-full border p-1.5 `} disabled={true}>
            Vote
          </button>
        </div>
      </div>
    </div>
  );
}
