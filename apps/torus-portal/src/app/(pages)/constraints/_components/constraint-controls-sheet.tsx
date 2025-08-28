"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Form } from "@torus-ts/ui/components/form";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@torus-ts/ui/components/sheet";
import { PermissionSelector } from "~/app/_components/permission-selector";
import { Info } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ConstraintExamplesSelector from "./constraint-examples-selector";
import { ConstraintTutorialDialog } from "./constraint-tutorial-dialog";

interface ConstraintControlsSheetProps {
  selectedExample: string;
  onLoadExample: (exampleId: string) => void;
  selectedPermissionId: string;
  onPermissionIdChange: (permissionId: string) => void;
  isEditingConstraint?: boolean;
}

export default function ConstraintControlsSheet({
  selectedExample,
  onLoadExample,
  selectedPermissionId,
  onPermissionIdChange,
  isEditingConstraint = false,
}: ConstraintControlsSheetProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Form for permission selection
  const form = useForm({
    defaultValues: {
      permissionId: selectedPermissionId,
    },
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="shadow-lg">
          <Info className="mr-1 h-4 w-4" />
          Open Constraint Details
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="z-[75] flex h-full w-full flex-col justify-between md:w-96"
      >
        <div>
          <SheetHeader>
            <SheetTitle className="text-start">
              {isEditingConstraint ? "Edit Constraint" : "Create Constraint"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-6 py-6">
            <ConstraintTutorialDialog />

            <Form {...form}>
              <PermissionSelector
                control={form.control}
                selectedPermissionId={selectedPermissionId}
                onPermissionIdChange={onPermissionIdChange}
              />
            </Form>

            <ConstraintExamplesSelector
              selectedExample={selectedExample}
              onExampleSelect={onLoadExample}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setIsOpen(false)}
          >
            Edit Constraint Details
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
