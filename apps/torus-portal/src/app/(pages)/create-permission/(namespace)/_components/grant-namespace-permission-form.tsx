"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useState } from "react";
import { GrantNamespacePermissionFormComponent } from "./grant-namespace-permission-form-content";
import { grantNamespacePermissionSchema } from "./grant-namespace-permission-form-schema";
import type { GrantNamespacePermissionFormData } from "./grant-namespace-permission-form-schema";
import { transformFormDataToSDK } from "./grant-namespace-permission-form-utils";

interface GrantNamespacePermissionFormProps {
  onSuccess?: () => void;
}

export default function GrantNamespacePermissionForm({
  onSuccess,
}: GrantNamespacePermissionFormProps) {
  const { grantNamespacePermissionTransaction } = useTorus();
  const { toast } = useToast();
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const form = useForm<GrantNamespacePermissionFormData>({
    resolver: zodResolver(grantNamespacePermissionSchema),
    defaultValues: {
      grantee: "",
      namespacePath: "",
      duration: {
        type: "Indefinite",
      },
      revocation: {
        type: "Irrevocable",
      },
    },
  });

  const handleSubmit = useCallback(
    async (data: GrantNamespacePermissionFormData) => {
      try {
        setTransactionStatus("loading");
        const transformedData = transformFormDataToSDK(data);

        await grantNamespacePermissionTransaction({
          ...transformedData,
          callback: (result) => {
            if (result.status === "SUCCESS" && result.finalized) {
              setTransactionStatus("success");
              onSuccess?.();
              // Reset form
              form.reset();
            } else if (result.status === "ERROR") {
              setTransactionStatus("error");
              toast({
                title: "Error",
                description:
                  result.message ?? "Failed to grant namespace permission",
                variant: "destructive",
              });
            }
          },
          refetchHandler: async () => {
            // No-op for now, could be used to refetch data after transaction
          },
        });
      } catch (error) {
        console.error("Error granting permission:", error);
        setTransactionStatus("error");
        toast({
          title: "Error",
          description: "Failed to grant namespace permission",
          variant: "destructive",
        });
      }
    },
    [grantNamespacePermissionTransaction, toast, form, onSuccess],
  );

  const mutation = {
    isPending: transactionStatus === "loading",
    mutate: handleSubmit,
  };

  return (
    <GrantNamespacePermissionFormComponent form={form} mutation={mutation} />
  );
}
