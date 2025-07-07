"use client";

import { useCallback, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { SS58Address } from "@torus-network/sdk";

import { useTorus } from "@torus-ts/torus-provider";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

import { GrantEmissionPermissionFormComponent } from "./grant-emission-permission-form-content";
import type { GrantEmissionPermissionFormData } from "./grant-emission-permission-form-schema";
import { grantEmissionPermissionSchema } from "./grant-emission-permission-form-schema";
import { transformFormDataToSDK } from "./grant-emission-permission-form-utils";

interface GrantEmissionPermissionFormProps {
  onSuccess?: () => void;
}

export default function GrantEmissionPermissionForm({
  onSuccess,
}: GrantEmissionPermissionFormProps) {
  const { grantEmissionPermissionTransaction, selectedAccount } = useTorus();
  const { toast } = useToast();
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const form = useForm<GrantEmissionPermissionFormData>({
    resolver: zodResolver(grantEmissionPermissionSchema),
    mode: "onChange",
    defaultValues: {
      allocation: {
        type: "Streams",
        streams: [],
      },
      targets: [{ account: "", weight: "" }],
      distribution: {
        type: "Interval",
        blocks: "",
      },
      duration: {
        type: "Indefinite",
      },
      revocation: {
        type: "RevocableByGrantor",
      },
      enforcement: {
        type: "ControlledBy",
        controllers: ["5DoVVgN7R6vHw4mvPX8s4EkkR8fgN1UJ5TDfKzab8eW9z89b"],
        requiredVotes: "1",
      },
    },
  });

  const handleSubmit = useCallback(
    async (data: GrantEmissionPermissionFormData) => {
      try {
        setTransactionStatus("loading");
        const transformedData = transformFormDataToSDK(data);

        await grantEmissionPermissionTransaction({
          grantee: selectedAccount?.address as SS58Address,
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
                  result.message ?? "Failed to grant emission permission",
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
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          description: `Failed to grant permission: ${error}`,
          variant: "destructive",
        });
      }
    },
    [
      grantEmissionPermissionTransaction,
      selectedAccount?.address,
      onSuccess,
      form,
      toast,
    ],
  );

  const mutation = {
    isPending: transactionStatus === "loading",
    mutate: handleSubmit,
  };

  return (
    <GrantEmissionPermissionFormComponent form={form} mutation={mutation} />
  );
}
