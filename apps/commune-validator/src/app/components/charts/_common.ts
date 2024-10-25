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

interface ModuleStakeItem {
  moduleName: string | null;
  stakeWeight: bigint;
  percWeight: number;
}

const reduceModuleItems =
  (label: string) =>
  (xs: ModuleStakeItem[]): ModuleStakeItem =>
    xs.reduce(
      (acc, x) => ({
        moduleName: acc.moduleName,
        stakeWeight: acc.stakeWeight + x.stakeWeight,
        percWeight: acc.percWeight + x.percWeight,
      }),
      {
        moduleName: label,
        stakeWeight: 0n,
        percWeight: 0,
      },
    );

const nonZeroModuleItem = (x: ModuleStakeItem) => x.stakeWeight > 0n;

export const separateTopNModules = (n: number) => (xs: ModuleStakeItem[]) =>
  separateTopAndOther(
    n,
    (a, b) => Number(-(a.stakeWeight - b.stakeWeight)),
    reduceModuleItems("Other"),
    xs,
  ).filter(nonZeroModuleItem);
