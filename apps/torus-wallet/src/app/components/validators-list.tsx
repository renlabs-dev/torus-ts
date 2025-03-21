"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { Balance, SS58Address } from "@torus-ts/subspace";
import { checkSS58 } from "@torus-ts/subspace";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";

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

interface ValidatorItemProps {
  validator: Validator;
  onSelect: (address: string) => void;
}

interface BackButtonProps {
  onBack: () => void;
}

function getDefaultValidators() {
  return [
    {
      name: "Torus Allocator",
      description: "Allocator of the Torus Allocator platform.",
      address: checkSS58(env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"))
    },
  ];
}

function ValidatorListHeader() {
  return (
    <CardHeader className="flex flex-col gap-2 px-0 pt-0">
      <h3 className="text-primary text-lg font-semibold">
        Select a Allocator
      </h3>
      <p className="text-muted-foreground pb-2">
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
  );
}

function ValidatorItem({ validator, onSelect }: ValidatorItemProps) {
  return (
    <Button
      key={validator.address}
      variant="outline"
      onClick={() => onSelect(validator.address)}
      className="flex h-fit w-full flex-col items-center font-semibold lg:flex-row lg:justify-between"
    >
      <span className="text-pretty">
        {validator.name && `${validator.name.toLocaleUpperCase()} / `}
        {validator.description}
      </span>
      <span className="text-muted-foreground">
        {smallAddress(validator.address, 10)}
      </span>
    </Button>
  );
}

function BackButton({ onBack }: BackButtonProps) {
  return (
    <Button
      onClick={onBack}
      variant="secondary"
      className="mt-6 flex w-full items-center justify-center text-nowrap px-4 py-2.5 font-semibold"
    >
      <ChevronLeft className="h-6 w-6" /> Back to Field Options
    </Button>
  );
}

function useValidatorsList(listType: "all" | "staked", accountStakedBy: UseQueryResult<{
  address: SS58Address;
  stake: Balance;
}[], Error>, excludedAddress: string) {
  const getStakedValidators = (): Validator[] => {
    if (!accountStakedBy.data) return [];

    return accountStakedBy.data
      .filter((validatorAddress) => excludedAddress !== validatorAddress.address)
      .map((item) => ({
        name: ``,
        description: `Staked amount: ${formatToken(Number(item.stake))}`,
        address: item.address,
        stake: item.stake,
      }));
  };

  const getAllValidators = (): Validator[] => {
    return getDefaultValidators().filter(
      (validatorAddress) => excludedAddress !== validatorAddress.address
    );
  };

  return listType === "staked" ? getStakedValidators() : getAllValidators();
}

export function ValidatorsList(props: Readonly<ValidatorsListProps>) {
  const { excludeAddress, listType, onBack, onSelectValidator } = props;
  const { accountStakedBy } = useWallet();
  const excludedAddress = excludeAddress ? excludeAddress() : "";

  const validators = useValidatorsList(listType, accountStakedBy, excludedAddress);

  const handleValidatorSelect = (address: string) => {
    onSelectValidator({ address });
  };

  return (
    <Card className="animate-fade flex w-full flex-col justify-between p-6">
      <ValidatorListHeader />
      <CardContent className="flex max-h-[200px] w-full flex-col gap-2 overflow-y-auto pb-0 pl-0 pr-1">
        {validators.length === 0 && (
          <p>You haven't staked to any validators yet.</p>
        )}
        {validators.map((validator) => (
          <ValidatorItem
            key={validator.address}
            validator={validator}
            onSelect={handleValidatorSelect}
          />
        ))}
      </CardContent>
      <BackButton onBack={onBack} />
    </Card>
  );
}
