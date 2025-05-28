"use client";

import { useCallback, useState } from "react";
import { Button } from "@torus-ts/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@torus-ts/ui/components/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";

import { constraintExamples } from "./constraint-data/constraint-data-examples";
import { useTorus } from "@torus-ts/torus-provider";
import { usePermissionsByGrantor } from "@torus-ts/query-provider/hooks";
import type { SS58Address } from "@torus-network/sdk";

// Placeholder permission IDs (Vec<H256>) - in the future this will come from a network query
const PLACEHOLDER_PERMISSION_IDS = [
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
  "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
  "0x5555aaaa5555aaaa5555aaaa5555aaaa5555aaaa5555aaaa5555aaaa5555aaaa",
];

interface ConstraintControlsSheetProps {
  selectedExample: string;
  onLoadExample: (exampleId: string) => void;
  onCreateConstraint: () => void;
  selectedPermissionId: string;
  onPermissionIdChange: (permissionId: string) => void;
}

export default function ConstraintControlsSheet({
  selectedExample,
  onLoadExample,
  onCreateConstraint,
  selectedPermissionId,
  onPermissionIdChange,
}: ConstraintControlsSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateConstraint = useCallback(() => {
    onCreateConstraint();
    // setIsOpen(false);
  }, [onCreateConstraint]);

  const { api, selectedAccount } = useTorus();

  const { data: permissionsByGrantor } = usePermissionsByGrantor(
    api,
    selectedAccount?.address as SS58Address,
    // "5CoS1LXeGQDiXxZ8TcdiMuzyFKu9Ku7XAihu9iS2tCACxf4n" as SS58Address,
  );

  if (permissionsByGrantor === undefined) {
    return console.log("Loading permissions by grantor...");
  }

  // 5CoS1LXeGQDiXxZ8TcdiMuzyFKu9Ku7XAihu9iS2tCACxf4n

  const [err, permissions] = permissionsByGrantor;
  if (err !== undefined) {
    console.error("Query failed:", err);
  }

  console.log("permissions", permissions);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="lg" className="shadow-lg">
          Create Constraint
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-96 z-[75]">
        <SheetHeader>
          <SheetTitle>Constraint Controls</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Permission</label>
            <Select
              value={selectedPermissionId}
              onValueChange={onPermissionIdChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select permission..." />
              </SelectTrigger>
              <SelectContent>
                {PLACEHOLDER_PERMISSION_IDS.map((permissionId, index) => (
                  <SelectItem key={permissionId} value={permissionId}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        Permission {index + 1}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {permissionId.slice(0, 16)}...{permissionId.slice(-8)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Load Example</label>
            <Select value={selectedExample} onValueChange={onLoadExample}>
              <SelectTrigger>
                <SelectValue placeholder="Load constraint example..." />
              </SelectTrigger>
              <SelectContent>
                {constraintExamples.map((example) => (
                  <SelectItem key={example.id} value={example.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{example.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {example.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter>
          <Button onClick={handleCreateConstraint} className="w-full">
            Create This Constraint
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
