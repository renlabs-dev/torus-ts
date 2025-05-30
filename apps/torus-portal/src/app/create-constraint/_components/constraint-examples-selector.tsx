"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@torus-ts/ui/components/command";

import { constraintExamples } from "./constraint-data/constraint-data-examples";

interface ConstraintExamplesSelectorProps {
  selectedExample: string;
  onExampleSelect: (exampleId: string) => void;
  onClose?: () => void;
}

export default function ConstraintExamplesSelector({
  selectedExample,
  onExampleSelect,
  onClose,
}: ConstraintExamplesSelectorProps) {
  const handleSelect = (currentValue: string) => {
    onExampleSelect(currentValue);
    onClose?.();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Load a Constraint Example</label>
      <Command className="border">
        <CommandInput placeholder="Search examples..." />
        <CommandList className="max-h-[250px]">
          <CommandEmpty>No examples found.</CommandEmpty>
          <CommandGroup>
            {constraintExamples.map((example) => (
              <CommandItem
                key={example.id}
                value={example.id}
                onSelect={handleSelect}
                className={
                  selectedExample === example.id ? "bg-accent text-white" : ""
                }
              >
                <div className="flex flex-col">
                  <span className="font-medium">{example.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {example.description}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
