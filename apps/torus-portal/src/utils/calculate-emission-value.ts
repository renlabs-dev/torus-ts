import type { TorAmount } from "@torus-network/torus-utils/torus/token";
import { makeTorAmount } from "@torus-network/torus-utils/torus/token";
import type { AccountEmissionData } from "~/hooks/use-multiple-account-emissions";

type DisplayMode = "full" | "fraction" | "value-only";

export function calculateEmissionValue(
  percentage: number,
  accountEmissions: AccountEmissionData | null | undefined,
  isAccountConnected: boolean,
  selectedAccountAddress: string | undefined,
  displayMode: DisplayMode = "full",
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

  const percentageFactor = percentage / 100;
  const incomingEmissions =
    accountEmissions.streams.incoming.tokensPerWeek.plus(
      accountEmissions.root.tokensPerWeek,
    );
  const totalEmissions = incomingEmissions.toNumber();

  const calculatedValue = incomingEmissions.multipliedBy(
    makeTorAmount(percentageFactor),
  );
  const value = calculatedValue.toNumber();

  // Handle zero percentage case
  if (percentage === 0) {
    switch (displayMode) {
      case "fraction":
        return `0 / ${totalEmissions.toFixed(2)}`;
      case "value-only":
        return "0.00 TORUS/week";
      case "full":
      default:
        return "0.00 TORUS/week";
    }
  }

  // Format the value
  let formattedValue: string;
  if (value < 0.01 && value > 0) {
    formattedValue = "< 0.01";
  } else {
    formattedValue = value.toFixed(2);
  }

  // Return based on display mode
  switch (displayMode) {
    case "fraction":
      return `${formattedValue} / ${totalEmissions.toFixed(2)}`;
    case "value-only":
      return `${formattedValue} TORUS/week`;
    case "full":
    default:
      return `${formattedValue} TORUS/week`;
  }
}

interface StreamData {
  permissionId: string;
  streamId: string;
  tokensPerWeek: TorAmount;
}

interface AccountStreamsResult {
  incoming: {
    streams: StreamData[];
  };
  isLoading: boolean;
  isError: boolean;
}

export function calculateIndividualStreamValue(
  percentage: number,
  streamId: string,
  accountStreams: AccountStreamsResult | null | undefined,
  isAccountConnected: boolean,
  selectedAccountAddress: string | undefined,
): string {
  if (
    !isAccountConnected ||
    !selectedAccountAddress ||
    !accountStreams ||
    accountStreams.isLoading ||
    accountStreams.isError
  ) {
    return "calculating...";
  }

  // Find the specific stream in the incoming streams
  const specificStream = accountStreams.incoming.streams.find(
    (stream) => stream.streamId === streamId,
  );

  if (!specificStream) {
    return "0/0 TORUS/week";
  }

  const totalStreamValue = specificStream.tokensPerWeek.toNumber();

  if (percentage === 0) {
    return `0/${totalStreamValue.toFixed(2)} TORUS/week`;
  }

  const percentageFactor = percentage / 100;
  const calculatedValue = specificStream.tokensPerWeek.multipliedBy(
    makeTorAmount(percentageFactor),
  );
  const allocatedValue = calculatedValue.toNumber();

  // Format allocated value
  let formattedAllocated: string;
  if (allocatedValue < 0.01 && allocatedValue > 0) {
    formattedAllocated = "< 0.01";
  } else {
    formattedAllocated = allocatedValue.toFixed(2);
  }

  return `${formattedAllocated}/${totalStreamValue.toFixed(2)} TORUS/week`;
}
