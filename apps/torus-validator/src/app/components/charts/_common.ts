const separateTopAndOther = <T>(
  numTop: number,
  compare: (a: T, b: T) => number,
  reduceRest: (xs: T[]) => T,
  xs: T[],
) => {
  if (xs.length < numTop) {
    return xs;
  }
  const sorted = xs.sort(compare);
  const top = sorted.slice(0, numTop);
  const rest = sorted.slice(numTop);
  const other = reduceRest(rest);
  return [...top, other];
};

interface AgentStakeItem {
  agentName: string | null;
  computedWeight: bigint;
  percComputedWeight: number;
}

const reduceModuleItems =
  (label: string) =>
  (xs: AgentStakeItem[]): AgentStakeItem =>
    xs.reduce(
      (acc, x) => ({
        agentName: acc.agentName,
        computedWeight: acc.computedWeight + x.computedWeight,
        percComputedWeight: acc.percComputedWeight + x.percComputedWeight,
      }),
      {
        agentName: label,
        computedWeight: 0n,
        percComputedWeight: 0,
      },
    );

const nonZeroModuleItem = (x: AgentStakeItem) => x.computedWeight > 0n;

export const separateTopNAgents = (n: number) => (xs: AgentStakeItem[]) =>
  separateTopAndOther(
    n,
    (a, b) => Number(-(a.computedWeight - b.computedWeight)),
    reduceModuleItems("Other"),
    xs,
  ).filter(nonZeroModuleItem);
