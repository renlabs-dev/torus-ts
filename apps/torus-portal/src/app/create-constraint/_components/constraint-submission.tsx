"use client";

import { useCallback, useState } from "react";
import { Button } from "@torus-ts/ui/components/button";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { api } from "../../../trpc/react";
import type { Edge, Node } from "@xyflow/react";
import { validateConstraintForm } from "./constraint-utils";

interface ConstraintSubmissionProps {
  nodes: Node[];
  edges: Edge[];
  rootNodeId: string;
  selectedPermissionId: string;
  isSubmitDisabled: boolean;
}

export function ConstraintSubmission({
  nodes,
  edges,
  rootNodeId,
  selectedPermissionId,
  isSubmitDisabled,
}: ConstraintSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const constraintMutation = api.constraint.addTest.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Constraint created successfully!",
        description: `Constraint ${result.constraintId} has been activated.`,
      });
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Constraint submission error:", error);
      toast({
        title: "Failed to create constraint",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmitConstraint = useCallback(async () => {
    if (isSubmitDisabled || isSubmitting) return;

    // Validate the constraint form
    const validationResult = validateConstraintForm(nodes, edges, rootNodeId);

    if (!validationResult.isValid) {
      toast({
        title: "Constraint validation failed",
        description: "Please fix the validation errors before submitting.",
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
        description:
          "Please select a permission ID before creating the constraint.",
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

      console.log("Submitting constraint:", {
        permId: constraintToSubmit.permId,
        body: constraintToSubmit.body,
      });

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
    isSubmitDisabled,
    isSubmitting,
    nodes,
    edges,
    rootNodeId,
    selectedPermissionId,
    toast,
    constraintMutation,
  ]);

  return (
    <Button
      onClick={handleSubmitConstraint}
      disabled={isSubmitDisabled || isSubmitting}
      className="w-full"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Creating Constraint...
        </>
      ) : (
        "Create This Constraint"
      )}
    </Button>
  );
}
