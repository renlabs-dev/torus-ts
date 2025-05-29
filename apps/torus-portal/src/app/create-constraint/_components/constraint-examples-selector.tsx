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
import { api } from "~/trpc/react";
import { deserializeConstraint, safeParseConstraintJson } from "@torus-ts/dsl";

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
  const { data: permissionsWithConstraints } =
    api.permission.withConstraints.useQuery();
  if (permissionsWithConstraints) {
    permissionsWithConstraints.forEach((permission) => {
      const x = permission.constraint;
      if(x){
        console.log("aaaaaa")
        const body = JSON.parse(x.body).json;
        console.log("Raw constraint body:", body);
        const ct = deserializeConstraint(JSON.stringify(JSON.parse(x.body).json));
        console.log("Deserialized constraint:", ct);
      }
    });
  }
  console.log("Permissions with constraints:", permissionsWithConstraints);
  
  const handleSelect = (currentValue: string) => {
    console.log(`Selected example: ${currentValue}`);
    onExampleSelect(currentValue);
    onClose?.();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Load Example</label>
      <Command className="border">
        <CommandInput placeholder="Search examples..." />
        <CommandList>
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
