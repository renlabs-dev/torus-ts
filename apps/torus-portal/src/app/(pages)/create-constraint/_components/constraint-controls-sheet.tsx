"use client";

import { useState } from "react";
import { Button } from "@torus-ts/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@torus-ts/ui/components/sheet";
import { Form } from "@torus-ts/ui/components/form";
import { useForm } from "react-hook-form";

import ConstraintExamplesSelector from "./constraint-examples-selector";

import { Info } from "lucide-react";
import { ConstraintTutorialDialog } from "./constraint-tutorial-dialog";
import PermissionSelector from "~/app/_components/permission-selector";

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
          <Info className="h-4 w-4 mr-1" />
          Open Constraint Details
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="md:w-96 w-full z-[75] flex flex-col justify-between h-full"
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
                name="permissionId"
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
