"use client";
import { toast } from "@torus-ts/toast-provider";
import { DateTime } from "luxon";
import { Card, CardContent, CardHeader, CopyButton } from "@torus-ts/ui";
import { smallAddress } from "@torus-ts/utils/subspace";
import { Crown } from "lucide-react";
import { api } from "~/trpc/react";
import type { AppRouter } from "@torus-ts/api";
import { ListContainer } from "../list-container";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { inferProcedureOutput } from "@trpc/server";

const handleStatusColors = (executed: boolean) =>
  executed
    ? "text-green-400 ring-green-400/20"
    : "text-red-400 ring-red-400/20";

export type PenaltyList = NonNullable<
  inferProcedureOutput<AppRouter["penalty"]["all"]>
>;

export type Agents = NonNullable<
  inferProcedureOutput<AppRouter["agent"]["all"]>
>;

function processPenalty(
  penalty: PenaltyList[number],
  search: string | null,
  agentsList: Agents | undefined,
): (PenaltyList[number] & { agentName?: string })[] {
  const searchLower = search?.toLocaleLowerCase();

  if (!agentsList && !searchLower) return [penalty];

  const agent = agentsList?.find((agent) => agent.key === penalty.agentKey);

  if (
    searchLower &&
    !penalty.content.toLocaleLowerCase().includes(searchLower) &&
    !agent?.name?.toLocaleLowerCase().includes(searchLower) &&
    !penalty.agentKey.toLocaleLowerCase().includes(searchLower) &&
    !penalty.cadreKey.toLocaleLowerCase().includes(searchLower) &&
    !penalty.penaltyFactor.toString().includes(searchLower)
  ) {
    return [];
  }

  if (!agent) return [penalty];

  return [{ ...penalty, agentName: agent.name ?? undefined }];
}

export const ListPenalties = () => {
  const { data: penaltyList, isFetching: isFetchingPenalties } =
    api.penalty.all.useQuery();
  const { data: agentsList } = api.agent.all.useQuery();
  const searchParams = useSearchParams();

  const content = useMemo(() => {
    if (!penaltyList) return [];
    const search = searchParams.get("search");
    return penaltyList.flatMap((penalty) =>
      processPenalty(penalty, search, agentsList),
    );
  }, [penaltyList, agentsList, searchParams]);

  if (isFetchingPenalties) return <p>Loading...</p>;
  if (!penaltyList) return <p>Something went wrong...</p>;
  if (penaltyList.length === 0 || content.length === 0)
    return <p>No penalties found</p>;

  return (
    <ListContainer
      smallesHeight={325}
      className="max-h-[calc(100svh-325px)] !animate-fade lg:max-h-[calc(100svh-265px)]"
    >
      {content.map((penalty) => (
        <PenaltyCard key={penalty.id} content={penalty} />
      ))}
    </ListContainer>
  );
};

const PenaltyCard = (props: {
  content: PenaltyList[number] & { agentName?: string };
}) => {
  const { content } = props;
  return (
    <Card className="relative">
      <li className="relative flex h-full flex-col">
        <CardHeader className="w-full items-start justify-between">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">
                {content.agentName ?? "No name"}
              </h3>
              <CopyButton
                copy={content.cadreKey}
                variant="link"
                notify={() => toast.success("Copied to clipboard")}
                className="h-5 items-center p-0 text-sm text-muted-foreground hover:text-white"
              >
                {smallAddress(content.agentKey, 10)}
              </CopyButton>
              <span
                className={`items-center rounded-full bg-muted-foreground/5 px-1.5 py-0.5 ${handleStatusColors(
                  content.executed,
                )} text-xs font-medium ring-1 ring-inset`}
              >
                {content.executed ? "Executed" : "Not executed"}
              </span>
            </div>
            <div className="flex gap-4">
              <CopyButton
                copy={content.cadreKey}
                variant="link"
                notify={() => toast.success("Copied to clipboard")}
                className="h-5 items-center p-0 text-sm text-muted-foreground hover:text-white"
              >
                <Crown size={10} />
                {smallAddress(content.cadreKey, 10)}
              </CopyButton>
              <p className="text-sm text-gray-500">
                {DateTime.fromJSDate(content.createdAt).toLocaleString(
                  DateTime.DATETIME_SHORT,
                )}
              </p>
            </div>
          </div>
          <p className="text-pretty text-sm text-pink-400">
            Penalty Factor: {content.penaltyFactor}%
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-pretty">{content.content}</p>
        </CardContent>
      </li>
    </Card>
  );
};
