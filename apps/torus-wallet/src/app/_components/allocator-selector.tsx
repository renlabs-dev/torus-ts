"use client";

import { checkSS58 } from "@torus-network/sdk";
import type { UseQueryResult } from "@tanstack/react-query";
import type { Balance, SS58Address } from "@torus-network/sdk";
import { smallAddress } from "@torus-ts/utils/subspace";
import { useState } from "react";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@torus-ts/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@torus-ts/ui/components/popover";
import { Button } from "@torus-ts/ui/components/button";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@torus-ts/ui/lib/utils";

interface Validator {
  name: string;
  description: string;
  address: string;
  stake?: bigint;
}

function getDefaultValidators() {
  return [
    {
      name: "Torus Allocator",
      description: "Allocator of the Torus Allocator platform.",
      address: checkSS58(env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS")),
    },
  ];
}

interface AllocatorSelectorProps {
  value: string;
  onSelect: (allocator: { address: string; stake?: string }) => void;
  listType: "all" | "staked";
  placeholder?: string;
  excludeAddress?: string;
  disabled?: boolean;
}

function useValidatorsList(
  listType: "all" | "staked",
  accountStakedBy: UseQueryResult<
    {
      address: SS58Address;
      stake: Balance;
    }[],
    Error
  >,
  excludedAddress: string,
) {
  const getStakedValidators = (): Validator[] => {
    if (!accountStakedBy.data) return [];

    return accountStakedBy.data
      .filter(
        (validatorAddress) => excludedAddress !== validatorAddress.address,
      )
      .map((item) => ({
        name: `Staked Allocator`,
        description: `Staked amount: ${Number(item.stake)}`,
        address: item.address,
        stake: item.stake,
      }));
  };

  const getAllValidators = (): Validator[] => {
    return getDefaultValidators().filter(
      (validatorAddress) => excludedAddress !== validatorAddress.address,
    );
  };

  return listType === "staked" ? getStakedValidators() : getAllValidators();
}

export function AllocatorSelector({
  value,
  onSelect,
  listType,
  placeholder = "Select allocator...",
  excludeAddress = "",
  disabled = false,
}: AllocatorSelectorProps) {
  const { accountStakedBy } = useWallet();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const validators = useValidatorsList(
    listType,
    accountStakedBy,
    excludeAddress,
  );

  const filteredValidators = validators.filter(
    (validator) =>
      validator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      validator.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      validator.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedValidator = validators.find(
    (validator) => validator.address === value,
  );

  const handleSelect = (allocator: Validator) => {
    onSelect({
      address: allocator.address,
      stake: allocator.stake?.toString(),
    });
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedValidator ? (
              <span className="truncate">
                {`${selectedValidator.name} (${smallAddress(selectedValidator.address, 8)})`}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[450px] z-50 border rounded-lg">
          <Command className="rounded-lg border shadow-md max-h-[80vh]">
            <CommandInput
              placeholder="Search allocator..."
              className="h-12"
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-[60vh] overflow-auto">
              <CommandEmpty>No allocator found.</CommandEmpty>
              <CommandGroup heading="Available Allocators">
                {filteredValidators.map((validator) => (
                  <CommandItem
                    key={validator.address}
                    value={validator.address}
                    onSelect={() => handleSelect(validator)}
                    className="py-3"
                  >
                    <div className="flex items-center w-full gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{validator.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {validator.address}
                        </span>
                        <span className="italic text-muted-foreground text-[0.7rem]">
                          {validator.description}
                        </span>
                      </div>
                      <CheckIcon
                        className={cn(
                          "mx-auto h-4 w-4",
                          value === validator.address
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {validator.stake && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          Stake: {Number(validator.stake)}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
