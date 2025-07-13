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

    // Add agent.{agentName} prefixes
    namespaceEntries.data.forEach((entry) => {
      if (entry.path.length >= 2) {
        const agentName = entry.path[1];
        prefixes.add(`agent.${agentName}`);
      }
    });

    // Add deeper nested prefixes
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

  // Set initial prefix when options are loaded
  if (prefixOptions.length > 0 && !selectedPrefix) {
    const basePrefix = prefixOptions.find((p) => p.split(".").length === 2);
    const defaultPrefix = basePrefix ?? prefixOptions[0];
    if (defaultPrefix) {
      onValueChange(defaultPrefix);
    }
  }

  return (
    <FormItem>
      <FormLabel>Capability Permission Prefix</FormLabel>
      <FormControl>
        {!isAccountConnected ? (
          <div className="text-sm text-muted-foreground p-3 border rounded-md h-10 flex items-center">
            Connect wallet...
          </div>
        ) : namespaceEntries.isLoading ? (
          <div className="text-sm text-muted-foreground p-3 border rounded-md h-10 flex items-center">
            Loading namespaces...
          </div>
        ) : prefixOptions.length === 0 ? (
          <div className="text-sm text-muted-foreground p-3 border rounded-md h-10 flex items-center">
            Agent registration required
          </div>
        ) : (
          <Select value={selectedPrefix} onValueChange={onValueChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a prefix..." />
            </SelectTrigger>
            <SelectContent>
              {prefixOptions.map((prefix) => (
                <SelectItem key={prefix} value={prefix}>
                  <span className="font-mono text-sm">{prefix}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormControl>
    </FormItem>
  );
}
