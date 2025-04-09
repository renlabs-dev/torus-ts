"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { Balance, SS58Address } from "@torus-network/sdk";
import { checkSS58 } from "@torus-network/sdk";
import { Button } from "@torus-ts/ui/components/button";
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
import { cn } from "@torus-ts/ui/lib/utils";
import type { BrandTag } from "@torus-ts/utils";
import { CheckIcon, ChevronsUpDownIcon, PlusCircleIcon } from "lucide-react";
import { useState } from "react";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";

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
  onSelect: (address: BrandTag<"SS58Address"> & string) => void;
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

  // Updated to handle custom addresses that aren't in the validators list
  const selectedValidator =
    validators.find((validator) => validator.address === value) ||
    (value
      ? {
          name: "Custom Allocator",
          description: "Custom allocator address",
          address: value,
        }
      : undefined);

  const handleSelect = (address: BrandTag<"SS58Address"> & string) => {
    onSelect(address);
    setOpen(false);
    setSearchTerm("");
  };

  const handleAddCustomAllocator = () => {
    handleSelect(searchTerm.trim() as BrandTag<"SS58Address"> & string);
  };

  const showCustomOption =
    searchTerm.trim().length > 0 &&
    !validators.some(
      (v) => v.address.toLowerCase() === searchTerm.toLowerCase(),
    ) &&
    !filteredValidators.some(
      (v) => v.address.toLowerCase() === searchTerm.toLowerCase(),
    );

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
              <span className="truncate">{selectedValidator.address}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[450px] z-50 border rounded-lg">
          <Command className="rounded-lg border shadow-md max-h-[80vh]">
            <CommandInput
              placeholder="Search allocator or enter address..."
              className="h-12"
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-[60vh] overflow-auto">
              {filteredValidators.length === 0 && !showCustomOption && (
                <CommandEmpty>No allocator found.</CommandEmpty>
              )}

              {showCustomOption && (
                <CommandGroup heading="Custom Allocator">
                  <CommandItem
                    value={searchTerm}
                    onSelect={handleAddCustomAllocator}
                    className="py-3 bg-muted/50"
                  >
                    <div className="flex items-center w-full gap-2">
                      <PlusCircleIcon className="h-4 w-4 mr-1" />
                      <div className="flex flex-col">
                        <span className="font-medium">Custom Allocator</span>
                        <span className="text-xs text-muted-foreground">
                          {searchTerm}
                        </span>
                        <span className="italic text-muted-foreground text-[0.7rem]">
                          Add custom allocator address
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}

              {filteredValidators.length > 0 && (
                <CommandGroup heading="Available Allocators">
                  {filteredValidators.map((validator) => (
                    <CommandItem
                      key={validator.address}
                      value={validator.address}
                      onSelect={() =>
                        handleSelect(
                          validator.address as BrandTag<"SS58Address"> & string,
                        )
                      }
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
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
