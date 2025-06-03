"use client";

import { useCallback, useState } from "react";
import { Button } from "@torus-ts/ui/components/button";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { api } from "../../../trpc/react";
import type { Edge, Node } from "@xyflow/react";
import { validateConstraintForm } from "./constraint-utils";
import { useTorus } from "@torus-ts/torus-provider";
import { smallAddress } from "@torus-network/torus-utils/subspace";

interface ConstraintSubmissionProps {
  nodes: Node[];
  edges: Edge[];
  rootNodeId: string;
  selectedPermissionId: string;
  isEditingConstraint: boolean;
}

export function ConstraintSubmission({
  nodes,
  edges,
  rootNodeId,
  selectedPermissionId,
  isEditingConstraint,
}: ConstraintSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { selectedAccount } = useTorus();

  const constraintMutation = api.constraint.addTest.useMutation({
    onSuccess: (result) => {
      toast({
        title: isEditingConstraint
          ? "Constraint updated successfully!"
          : "Constraint created successfully!",
        description: `Constraint ${smallAddress(result.constraintId)} has been ${isEditingConstraint ? "updated and" : ""} activated.`,
      });
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Constraint submission error:", error);
      toast({
        title: isEditingConstraint
          ? "Failed to update constraint"
          : "Failed to create constraint",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmitConstraint = useCallback(async () => {
    if (isSubmitting) return;

    console.log("handleSubmitConstraint");

    // Validate the constraint form
    const validationResult = validateConstraintForm(nodes, edges, rootNodeId);

    if (!selectedAccount?.address) {
      toast({
        title: "Wallet required",
        description: `Please connect your wallet to create the constraint.`,
        variant: "destructive",
      });
      return;
    }

    if (!validationResult.isValid) {
      const errorSummary = validationResult.errors
        .slice(0, 3)
        .map(
          (error) =>
            `${error.nodeId === "permission-id" ? "Permission ID" : error.nodeId === "constraint" ? "Constraint" : `Node ${error.nodeId}`}: ${error.message}`,
        )
        .join("; ");

      const additionalErrorsCount = validationResult.errors.length - 3;
      const description =
        errorSummary +
        (additionalErrorsCount > 0
          ? ` (and ${additionalErrorsCount} more errors)`
          : "");

      toast({
        title: "Constraint validation failed",
        description: description,
        variant: "destructive",
      });
      return;
    }

    if (!validationResult.constraint) {
      toast({
        title: "No constraint generated",
        description:
          "Unable to generate constraint from current configuration.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPermissionId) {
      toast({
        title: "Permission required",
        description: `Please select a permission ID before ${isEditingConstraint ? "updating" : "creating"} the constraint.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the constraint object with the selected permission ID
      const constraintToSubmit = {
        ...validationResult.constraint,
        permId: selectedPermissionId,
      };

      console.log(
        `${isEditingConstraint ? "Updating" : "Submitting"} constraint:`,
        {
          permId: constraintToSubmit.permId,
          body: constraintToSubmit.body,
        },
      );

      // Submit the constraint via tRPC
      const result = await constraintMutation.mutateAsync({
        constraint: constraintToSubmit,
      });

      console.log("Constraint submission result:", result);
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error("Error in handleSubmitConstraint:", error);
    }
  }, [
    isSubmitting,
    nodes,
    edges,
    rootNodeId,
    selectedAccount?.address,
    selectedPermissionId,
    toast,
    isEditingConstraint,
    constraintMutation,
  ]);

  return (
    <Button onClick={handleSubmitConstraint} className="w-full">
      {isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {isEditingConstraint ? "Updating" : "Creating"} Constraint...
        </>
      ) : isEditingConstraint ? (
        "Update This Constraint"
      ) : (
        "Create This Constraint"
      )}
    </Button>
  );
}
