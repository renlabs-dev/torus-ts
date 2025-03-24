import { Label } from "@torus-ts/ui/components/label";

export function handleVoteLabel(
  vote: string,
  accept: number,
  refuse: number,
): JSX.Element {
  const votedText =
    vote === "ACCEPT" ? (
      <>
        (You voted&nbsp;
        <span className="text-green-500">In&nbsp;Favor</span>)&nbsp;
      </>
    ) : vote === "REFUSE" ? (
      <>
        (You voted&nbsp;
        <span className="text-red-500">Against</span>)&nbsp;
      </>
    ) : (
      ""
    );

  return (
    <Label className="flex flex-wrap items-center justify-center gap-2 text-xs">
      <div className="flex justify-start text-nowrap text-gray-500">
        {votedText}
        <div className="flex gap-2">
          <span className="text-red-500">{refuse}</span>
          Against |&nbsp;
        </div>
        <div className="flex gap-2">
          <span className="text-green-500">{accept}</span>
          In Favor
        </div>
      </div>
    </Label>
  );
}
