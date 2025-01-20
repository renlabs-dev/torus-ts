"use client";
import { toast } from "@torus-ts/toast-provider";
import { DateTime } from "luxon";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CopyButton,
} from "@torus-ts/ui";
import { smallAddress } from "@torus-ts/utils/subspace";
import { Crown } from "lucide-react";

// type Status = "UNVOTED" | "FOR" | "AGAINST" | null;

// const handleStatusColors = (status: "FOR" | "AGAINST" | "UNVOTED" | null) => {
//   const statusColors = {
//     FOR: "text-green-400 ring-green-400/20",
//     AGAINST: "text-red-400 ring-red-400/20",
//     UNVOTED: "text-gray-400 ring-gray-400/20",
//   };

//   return statusColors[status ?? "UNVOTED"];
// };

// function handlePercentages(
//   favorablePercent: number | null,
// ): JSX.Element | null {
//   if (favorablePercent === null) return null;

//   const againstPercent = 100 - favorablePercent;
//   if (Number.isNaN(favorablePercent)) {
//     return (
//       <div className="flex w-auto pt-4 text-center text-sm text-yellow-500">
//         <p>– %</p>
//       </div>
//     );
//   }
//   return (
//     <div className="flex w-full items-start space-x-0 divide-x divide-white/10 pt-4 text-left text-sm">
//       <div className="flex gap-2 pr-2">
//         <span className="text-green-500">
//           Favorable {favorablePercent.toFixed(0)}%
//         </span>
//       </div>
//       <div className="flex gap-2 pl-2">
//         <span className="text-red-500">
//           {againstPercent.toFixed(0)}% Against
//         </span>
//       </div>
//     </div>
//   );
// }

export const CuratorCandidatesList = (props: {
  curatorCandidates: {
    userKey: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    id: number;
    content: string;
    discordId: string;
  };
}) => {
  const { curatorCandidates } = props;

  return (
    <Card className="relative">
      <li className={`relative flex h-full flex-col`}>
        <CardHeader className="w-full items-start justify-between">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">
                #{curatorCandidates.discordId}
              </h3>
              {/* 
                  <span
                    className={`items-center rounded-full bg-muted-foreground/5 px-1.5 py-0.5 text-xs font-medium ${handleStatusColors(person.status as Status)} ring-1 ring-inset`}
                  >
                    {curatorCandidates.status}
                  </span> */}
            </div>
            <CopyButton
              copy={curatorCandidates.userKey}
              variant={"link"}
              notify={() => toast.success("Copied to clipboard")}
              className="h-5 items-center p-0 text-sm text-muted-foreground hover:text-white"
            >
              <Crown size={10} />
              {smallAddress(curatorCandidates.userKey, 10)}
            </CopyButton>
          </div>

          <p className="text-sm text-gray-500">
            {DateTime.fromJSDate(curatorCandidates.createdAt).toLocaleString(
              DateTime.DATETIME_SHORT,
            )}
          </p>
        </CardHeader>

        <CardContent>
          <p className="text-pretty text-muted-foreground">
            {curatorCandidates.content}
          </p>
        </CardContent>

        <CardFooter className="mt-auto flex flex-col gap-4">
          {/* {handlePercentages(person.votesFor)} */}

          <div className="flex w-full gap-4">
            <Button
              variant="destructive"
              className="relative w-full py-4 text-sm font-semibold"
            >
              Refuse
            </Button>
            <Button className="relative w-full py-4 text-sm font-semibold">
              Accept
            </Button>
          </div>
        </CardFooter>
      </li>
    </Card>
  );
};
