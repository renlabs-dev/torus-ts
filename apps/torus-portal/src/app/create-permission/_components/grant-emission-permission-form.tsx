"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useState } from "react";
import { GrantEmissionPermissionFormComponent } from "./grant-emission-permission-form-content";
import { grantEmissionPermissionSchema } from "./grant-emission-permission-form-schema";
import type { GrantEmissionPermissionFormData } from "./grant-emission-permission-form-schema";
import { transformFormDataToSDK } from "./grant-emission-permission-form-utils";
interface GrantEmissionPermissionFormProps {
  onSuccess?: () => void;
}

export default function GrantEmissionPermissionForm({
  onSuccess,
}: GrantEmissionPermissionFormProps) {
  const { grantEmissionPermissionTransaction } = useTorus();
  const { toast } = useToast();
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const form = useForm<GrantEmissionPermissionFormData>({
    resolver: zodResolver(grantEmissionPermissionSchema),
    defaultValues: {
      grantee: "",
      allocation: {
        type: "Streams",
        streams: [],
      },
      targets: [{ account: "", weight: "" }],
      distribution: {
        type: "Manual",
      },
      duration: {
        type: "Indefinite",
      },
      revocation: {
        type: "Irrevocable",
      },
      enforcement: {
        type: "None",
      },
    },
  });

  const handleSubmit = useCallback(
    async (data: GrantEmissionPermissionFormData) => {
      try {
        setTransactionStatus("loading");
        const transformedData = transformFormDataToSDK(data);

        await grantEmissionPermissionTransaction({
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
          description: "Failed to grant emission permission",
          variant: "destructive",
        });
      }
    },
    [grantEmissionPermissionTransaction, toast, form, onSuccess],
  );

  const mutation = {
    isPending: transactionStatus === "loading",
    mutate: handleSubmit,
  };

  return (
    <GrantEmissionPermissionFormComponent form={form} mutation={mutation} />
  );
}
