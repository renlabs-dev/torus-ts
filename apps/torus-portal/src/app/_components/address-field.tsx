"use client";

import * as React from "react";
import { useCallback, useMemo, useState } from "react";

import { Copy, Search, Users } from "lucide-react";

import { smallAddress } from "@torus-network/torus-utils/torus";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@torus-ts/ui/components/command";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { DialogTitle } from "@torus-ts/ui/components/dialog";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";
import { cn } from "@torus-ts/ui/lib/utils";

import { api } from "~/trpc/react";

interface AddressFieldProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function AddressField({
  value,
  onValueChange,
  disabled,
  label,
  className,
}: AddressFieldProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const isMobile = useIsMobile();

  const { data: agents, isLoading } =
    api.agent.allIncludingNonWhitelisted.useQuery();

  const formatAgentName = useCallback(
    (name: string) => {
      return name.length > 15
        ? `${name.substring(0, isMobile ? 4 : 20)}...`
        : name;
    },
    [isMobile],
  );

  const searchData = useMemo(() => {
    if (!agents) return { whitelistedAgents: [], nonWhitelistedAgents: [] };

    const whitelisted = agents.filter((agent) => agent.isWhitelisted);
    const nonWhitelisted = agents.filter((agent) => !agent.isWhitelisted);

    if (!searchValue) {
      return {
        whitelistedAgents: whitelisted,
        nonWhitelistedAgents: nonWhitelisted,
      };
    }

    const filterFn = (agent: (typeof agents)[0]) =>
      (agent.name?.toLowerCase().includes(searchValue.toLowerCase()) ??
        false) ||
      agent.key.toLowerCase().includes(searchValue.toLowerCase());

    return {
      whitelistedAgents: whitelisted.filter(filterFn),
      nonWhitelistedAgents: nonWhitelisted.filter(filterFn),
    };
  }, [agents, searchValue]);

  const selectedAgent = React.useMemo(() => {
    if (!value || !agents) return null;
    return agents.find((agent) => agent.key === value);
  }, [value, agents]);

  const handleSelect = useCallback(
    (agentKey: string) => {
      onValueChange?.(agentKey);
      setOpen(false);
      setSearchValue("");
    },
    [onValueChange],
  );

  const title = isMobile
    ? "Search agents..."
    : "Search agents by name or address...";

  const displayValue = selectedAgent
    ? `${formatAgentName(selectedAgent.name ?? selectedAgent.key)}(${smallAddress(selectedAgent.key, isMobile ? 3 : 6)})`
    : title;

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {label && <FormLabel>{label}</FormLabel>}
        <div className="flex gap-2">
          <button
            className="text-sm border p-2.5 gap-6 w-full justify-between flex items-center
              bg-field-background"
            onClick={() => setOpen(true)}
            disabled={disabled}
          >
            <span className="flex items-center gap-2 text-muted-foreground text-nowrap">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{displayValue}</span>
            </span>
            <kbd
              className="bg-muted sm:inline-flex hidden text-muted-foreground pointer-events-none h-5
                items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium
                opacity-100 select-none"
            >
              <span className="text-xs">⌘</span>A
            </kbd>
          </button>

          {value && (
            <CopyButton
              copy={value}
              variant="outline"
              message="Address copied to clipboard"
              className="shrink-0 h-[2.6rem]"
            >
              <Copy className="h-4 w-4" />
            </CopyButton>
          )}
        </div>
        <FormMessage />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="hidden">{title}</DialogTitle>

        <CommandInput
          placeholder={title}
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? "Loading agents..." : "No agents found."}
          </CommandEmpty>

          {searchData.whitelistedAgents.length > 0 && (
            <CommandGroup heading="Root Agents">
              {searchData.whitelistedAgents.map((agent) => (
                <CommandItem
                  key={agent.key}
                  value={`${agent.name ?? agent.key} ${agent.key}`.toLowerCase()}
                  onSelect={() => handleSelect(agent.key)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {agent.name ?? smallAddress(agent.key)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {smallAddress(agent.key)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchData.nonWhitelistedAgents.length > 0 && (
            <CommandGroup heading="Agents">
              {searchData.nonWhitelistedAgents.map((agent) => (
                <CommandItem
                  key={agent.key}
                  value={`${agent.name ?? agent.key} ${agent.key}`.toLowerCase()}
                  onSelect={() => handleSelect(agent.key)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium text-muted-foreground">
                      {agent.name ?? smallAddress(agent.key)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {smallAddress(agent.key)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

interface FormAddressFieldProps extends AddressFieldProps {
  field: {
    value: string;
    onChange: (value: string) => void;
  };
}

export function FormAddressField({ field, ...props }: FormAddressFieldProps) {
  return (
    <FormItem>
      <FormControl>
        <AddressField
          value={field.value}
          onValueChange={field.onChange}
          {...props}
        />
      </FormControl>
    </FormItem>
  );
}
