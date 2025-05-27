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

interface ConstraintControlsSheetProps {
  selectedExample: string;
  onLoadExample: (exampleId: string) => void;
  onCreateConstraint: () => void;
}

export default function ConstraintControlsSheet({
  selectedExample,
  onLoadExample,
  onCreateConstraint,
}: ConstraintControlsSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateConstraint = useCallback(() => {
    onCreateConstraint();
    setIsOpen(false);
  }, [onCreateConstraint]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="lg" className="shadow-lg">
          Create Constraint
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-96 z-[100]">
        <SheetHeader>
          <SheetTitle>Constraint Controls</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
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
