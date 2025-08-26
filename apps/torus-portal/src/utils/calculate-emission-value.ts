import { makeTorAmount } from "@torus-network/torus-utils/torus/token";

import type { AccountEmissionData } from "~/hooks/use-multiple-account-emissions";

export function calculateEmissionValue(
  percentage: number,
  accountEmissions: AccountEmissionData | null | undefined,
  isAccountConnected: boolean,
  selectedAccountAddress: string | undefined,
): string {
  if (
    !isAccountConnected ||
    !selectedAccountAddress ||
    !accountEmissions ||
    accountEmissions.isLoading ||
    accountEmissions.isError
  ) {
    return "calculating...";
  }

  if (percentage === 0) return "0.00 TORUS/week";

  const percentageFactor = percentage / 100;
  const incomingEmissions =
    accountEmissions.streams.incoming.tokensPerWeek.plus(
      accountEmissions.root.tokensPerWeek,
    );

  const calculatedValue = incomingEmissions.multipliedBy(
    makeTorAmount(percentageFactor),
  );
  const value = calculatedValue.toNumber();

  if (value < 0.01 && value > 0) return "< 0.01 TORUS/week";
  return `${value.toFixed(2)} TORUS/week`;
}
