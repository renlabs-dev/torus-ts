"use client";

import React, { memo, useCallback, useState } from "react";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@torus-ts/ui/components/command";
import { DialogTitle } from "@torus-ts/ui/components/dialog";

interface PermissionGraphCommandProps {
  graphNodes?: string[];
}

const PermissionGraphCommand = memo(function PermissionGraphCommand({
  graphNodes = [],
}: PermissionGraphCommandProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (nodeId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", nodeId);
      router.replace(`/?${params.toString()}`, { scroll: false });
      setOpen(false);
    },
    [router, searchParams],
  );

  const formatNodeDisplay = useCallback((node: string) => {
    return node.length > 20
      ? `${node.substring(0, 10)}...${node.substring(node.length - 8)}`
      : node;
  }, []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        className="text-sm border p-2.5 w-72 justify-between rounded flex items-center"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <Search className="w-4 h-4 text-muted-foreground" />
          Seach agents...{" "}
        </span>
        <kbd
          className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center
            gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100
            select-none"
        >
          <span className="text-xs">⌘</span>J
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="hidden">Search Agents</DialogTitle>

        <CommandInput placeholder="Search by agent key..." />
        <CommandList>
          <CommandGroup heading="All Agents">
            {graphNodes.map((node) => (
              <CommandItem
                key={node}
                value={node}
                onSelect={() => handleSelect(node)}
              >
                {formatNodeDisplay(node)}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
});

export default PermissionGraphCommand;
