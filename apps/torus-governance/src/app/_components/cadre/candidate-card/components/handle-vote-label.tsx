import { Label } from "@torus-ts/ui/components/label";

interface HandleVoteLabelProps {
  vote: string;
  accept: number;
  refuse: number;
}

export function HandleVoteLabel(props: HandleVoteLabelProps) {
  return (
    <Label className="flex flex-wrap items-center justify-center gap-2 text-sm">
      <div className="flex justify-start text-nowrap text-gray-500">
        <div className="flex gap-2">
          <span className="text-red-500">{props.refuse}</span>
          Against |&nbsp;
        </div>
        <div className="flex gap-2">
          <span className="text-green-500">{props.accept}</span>
          In Favor
        </div>
      </div>
    </Label>
  );
}
