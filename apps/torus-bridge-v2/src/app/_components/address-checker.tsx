"use client";

import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { env } from "~/env";
import { useProof } from "~/hooks/use-proof";
import { torusMigrationClaimAbi } from "~/lib/contract";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { isAddress } from "viem";
import { useReadContract } from "wagmi";

export function AddressChecker() {
  const contractAddress = env(
    "NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS",
  ) as `0x${string}`;

  const [inputValue, setInputValue] = useState("");
  const [checkedAddress, setCheckedAddress] = useState<
    `0x${string}` | undefined
  >();
  const [inputError, setInputError] = useState<string | undefined>();

  const proofQuery = useProof(checkedAddress);
  const proof = proofQuery.data ?? undefined;

  const { data: isClaimed, isLoading: isClaimedLoading } = useReadContract({
    address: contractAddress,
    abi: torusMigrationClaimAbi,
    functionName: "isClaimed",
    args: proof !== undefined ? [BigInt(proof.index)] : undefined,
    query: { enabled: proof !== undefined },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setInputError("Enter an address to check.");
      return;
    }
    if (!isAddress(trimmed)) {
      setInputError("Not a valid EVM address (must start with 0x).");
      return;
    }
    setInputError(undefined);
    setCheckedAddress(trimmed);
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (inputError) setInputError(undefined);
          }}
          placeholder="0x..."
          className="font-mono text-xs"
          aria-label="EVM address to check"
        />
        <Button type="submit" variant="outline" size="sm" className="shrink-0">
          Check
        </Button>
      </form>

      {inputError !== undefined && (
        <p className="text-destructive text-xs">{inputError}</p>
      )}

      {checkedAddress !== undefined && (
        <CheckerResult
          checkedAddress={checkedAddress}
          proofIsPending={proofQuery.isPending}
          proofIsError={proofQuery.isError}
          proofAmount={proof?.amount}
          proofIsNull={proofQuery.data === null}
          isClaimed={isClaimed}
          isClaimedLoading={isClaimedLoading}
        />
      )}

      {checkedAddress === undefined && !inputError && (
        <p className="text-muted-foreground text-xs">
          Check any 0x address for migration eligibility.
        </p>
      )}
    </div>
  );
}

interface CheckerResultProps {
  checkedAddress: `0x${string}`;
  proofIsPending: boolean;
  proofIsError: boolean;
  proofAmount: string | undefined;
  proofIsNull: boolean;
  isClaimed: boolean | undefined;
  isClaimedLoading: boolean;
}

function CheckerResult({
  checkedAddress,
  proofIsPending,
  proofIsError,
  proofAmount,
  proofIsNull,
  isClaimed,
  isClaimedLoading,
}: Readonly<CheckerResultProps>) {
  const shortAddr = `${checkedAddress.slice(0, 6)}…${checkedAddress.slice(-4)}`;

  if (proofIsPending) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (proofIsError) {
    return (
      <p className="text-destructive text-xs">
        Failed to load proof data. Try again.
      </p>
    );
  }

  if (proofIsNull) {
    return (
      <div className="text-muted-foreground flex items-start gap-2 text-xs">
        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          <span className="font-mono">{shortAddr}</span> is not in the migration
          snapshot.
        </span>
      </div>
    );
  }

  if (proofAmount === undefined || isClaimedLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Checking on-chain status…</span>
      </div>
    );
  }

  if (isClaimed === true) {
    return (
      <div className="text-muted-foreground flex items-start gap-2 text-xs">
        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500/60" />
        <span>
          <span className="font-mono">{shortAddr}</span> has already claimed{" "}
          <span className="text-foreground font-medium">
            {proofAmount} TORUS
          </span>
          .
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 text-xs">
      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
      <span>
        <span className="font-mono">{shortAddr}</span> is eligible —{" "}
        <Badge variant="outline" className="h-4 px-1 py-0 text-xs">
          {proofAmount} TORUS
        </Badge>{" "}
        available to claim.
      </span>
    </div>
  );
}
