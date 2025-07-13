import { useMemo } from "react";

import type { SS58Address } from "@torus-network/sdk";

import { useNamespaceEntriesOf } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { FormControl, FormItem, FormLabel } from "@torus-ts/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";

interface CreateCapabilityPrefixFieldProps {
  selectedPrefix: string;
  onValueChange: (value: string) => void;
  isAccountConnected: boolean;
}

export function CreateCapabilityPrefixField({
  selectedPrefix,
  onValueChange,
  isAccountConnected,
}: CreateCapabilityPrefixFieldProps) {
  const { api, selectedAccount } = useTorus();

  const namespaceEntries = useNamespaceEntriesOf(
    api,
    selectedAccount?.address as SS58Address,
  );

  const prefixOptions = useMemo(() => {
    if (!namespaceEntries.data || namespaceEntries.data.length === 0) {
      return [];
    }

    const prefixes = new Set<string>();

    namespaceEntries.data.forEach((entry) => {
      if (entry.path.length >= 2) {
        const agentName = entry.path[1];
        prefixes.add(`agent.${agentName}`);
      }
    });

    namespaceEntries.data.forEach((entry) => {
      if (entry.path.length >= 3) {
        for (let i = 3; i <= entry.path.length; i++) {
          const prefix = entry.path.slice(0, i).join(".");
          prefixes.add(prefix);
        }
      }
    });

    return Array.from(prefixes).sort();
  }, [namespaceEntries.data]);

  return (
    <FormItem>
      <FormLabel>Select a Capability Prefix</FormLabel>
      <FormControl>
        {!isAccountConnected ? (
          <div className="text-sm text-muted-foreground p-3 border h-10 flex items-center">
            Connect wallet...
          </div>
        ) : namespaceEntries.isLoading ? (
          <div className="text-sm text-muted-foreground p-3 border h-10 flex items-center">
            Loading namespaces...
          </div>
        ) : prefixOptions.length === 0 ? (
          <div className="text-sm text-destructive p-3 border sm:h-10 flex items-center">
            Registration required. Please register your agent before creating a
            capability.
          </div>
        ) : (
          <Select value={selectedPrefix} onValueChange={onValueChange}>
            <SelectTrigger className="w-full [&>span]:truncate [&>span]:max-w-full">
              <SelectValue placeholder="Select capability" />
            </SelectTrigger>
            <SelectContent className="max-w-[90vw]">
              {prefixOptions.map((prefix) => (
                <SelectItem
                  key={prefix}
                  value={prefix}
                  className="font-mono text-sm"
                >
                  {prefix}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormControl>
    </FormItem>
  );
}
