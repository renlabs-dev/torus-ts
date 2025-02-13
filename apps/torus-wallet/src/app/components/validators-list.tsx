"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button, Card, CardContent, CardHeader } from "@torus-ts/ui";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";

import { useWallet } from "~/context/wallet-provider";
import { ALLOCATOR_ADDRESS } from "~/consts";

interface ValidatorsListProps {
  listType: "all" | "staked";
  onSelectValidator: (validator: { address: string; stake?: string }) => void;
  onBack: () => void;
  excludeAddress?: () => string;
}

interface Validator {
  name: string;
  description: string;
  address: string;
  stake?: bigint;
}

export function ValidatorsList(props: ValidatorsListProps) {
  const { excludeAddress, listType, onBack, onSelectValidator } = props;
  const { accountStakedBy } = useWallet();

  const excludedAddress = excludeAddress ? excludeAddress() : "";

  const validatorsList = [
    {
      name: "Torus Allocator",
      description: "Allocator of the Torus Allocator platform.",
      address: ALLOCATOR_ADDRESS, // TODO: unhardcode/move
    },
  ];

  function getValidatorsList(): Validator[] {
    if (listType === "staked" && accountStakedBy.data) {
      const accountStakeList = accountStakedBy.data.filter(
        (validatorAddress) => excludedAddress !== validatorAddress.address,
      );

      return accountStakeList.map((item) => ({
        name: ``,
        description: `Staked amount: ${formatToken(Number(item.stake))}`,
        address: item.address,
        stake: item.stake,
      }));
    }

    return validatorsList.filter(
      (validatorAddress) => excludedAddress !== validatorAddress.address,
    );
  }

  const currentList = getValidatorsList();

  return (
    <Card className="flex w-full animate-fade flex-col justify-between p-6">
      <CardHeader className="flex flex-col gap-2 px-0 pt-0">
        <h3 className="text-lg font-semibold text-primary">
          Select a Allocator
        </h3>
        <p className="pb-2 text-muted-foreground">
          Once you select a allocator, it will automatically fill the field with
          their address. View all validators list{" "}
          <Link
            href="https://torex.rs/agents"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            here
          </Link>
          .
        </p>
      </CardHeader>
      <CardContent className="flex max-h-[200px] w-full flex-col gap-2 overflow-y-auto pb-0 pl-0 pr-1">
        {currentList.length === 0 && (
          <p>You haven't staked to any validators yet.</p>
        )}
        {currentList.map((item) => (
          <Button
            key={item.address}
            variant="outline"
            onClick={() => onSelectValidator({ address: item.address })}
            className="flex h-fit w-full flex-col items-center font-semibold lg:flex-row lg:justify-between"
          >
            <span className="text-pretty">
              {item.name && `${item.name.toLocaleUpperCase()} / `}
              {item.description}
            </span>
            <span className="text-muted-foreground">
              {smallAddress(item.address, 10)}
            </span>
          </Button>
        ))}
      </CardContent>
      <Button
        onClick={onBack}
        variant="secondary"
        className="mt-6 flex w-full items-center justify-center text-nowrap px-4 py-2.5 font-semibold"
      >
        <ChevronLeft className="h-6 w-6" /> Back to Field Options
      </Button>
    </Card>
  );
}
