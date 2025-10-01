import type { UseQueryResult } from "@tanstack/react-query";
import type { NamespaceEntry } from "@torus-network/sdk/chain";
import { FormControl, FormItem, FormLabel } from "@torus-ts/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";
import { truncateMobileValue } from "~/utils/truncate-mobile-value";
import { useMemo } from "react";

interface RegisterCapabilityPrefixFieldProps {
  selectedPrefix: string;
  onValueChange: (value: string) => void;
  isAccountConnected: boolean;
  namespaceEntries: UseQueryResult<NamespaceEntry[], Error>;
}

export function RegisterCapabilityPrefixField({
  selectedPrefix,
  onValueChange,
  isAccountConnected,
  namespaceEntries,
}: RegisterCapabilityPrefixFieldProps) {
  const isMobile = useIsMobile();

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
          <div className="text-muted-foreground flex h-10 items-center border p-3 text-sm">
            Connect wallet...
          </div>
        ) : namespaceEntries.isLoading ? (
          <div className="text-muted-foreground flex h-10 items-center border p-3 text-sm">
            Loading namespaces...
          </div>
        ) : prefixOptions.length === 0 ? (
          <div className="text-destructive flex items-center border p-3 text-sm sm:h-10">
            Registration required. Please register your agent before registering
            a capability.
          </div>
        ) : (
          <Select value={selectedPrefix} onValueChange={onValueChange}>
            <SelectTrigger className="w-full max-w-[44rem]">
              <SelectValue placeholder="Select capability">
                {truncateMobileValue(selectedPrefix, isMobile)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {prefixOptions.map((prefix) => (
                <SelectItem key={prefix} value={prefix}>
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
