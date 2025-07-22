"use client";

import { useCallback, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import type { SS58Address } from "@torus-network/sdk/types";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Form } from "@torus-ts/ui/components/form";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

import { AllocationField } from "./create-emission-fields/allocation-field";
import { DistributionField } from "./create-emission-fields/distribution-field";
import { DurationField } from "./create-emission-fields/duration-field";
import { RevocationField } from "./create-emission-fields/revocation-field";
import { TargetsField } from "./create-emission-fields/targets-field";
import type { CreateEmissionPermissionFormData } from "./create-emission-permission-form-schema";
import { createEmissionPermissionSchema } from "./create-emission-permission-form-schema";
import { transformFormDataToSDK } from "./create-emission-permission-form-utils";

export function CreateEmissionPermissionForm() {
  const {
    grantEmissionPermissionTransaction,
    selectedAccount,
    isAccountConnected,
    isInitialized,
    api,
  } = useTorus();
  const { toast } = useToast();
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const form = useForm<CreateEmissionPermissionFormData>({
    resolver: zodResolver(createEmissionPermissionSchema),
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
    async (data: CreateEmissionPermissionFormData) => {
      try {
        setTransactionStatus("loading");
        const transformedData = transformFormDataToSDK(data);

        await grantEmissionPermissionTransaction({
          grantee: selectedAccount?.address as SS58Address,
          ...transformedData,
          callback: (result) => {
            if (result.status === "SUCCESS" && result.finalized) {
              setTransactionStatus("success");

              // Reset form
              form.reset();
            } else if (result.status === "ERROR") {
              setTransactionStatus("error");
              toast({
                title: "Error",
                description:
                  result.message ?? "Failed to delegate emission permission",
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
          description: `Failed to grant permission: ${error as string}`,
          variant: "destructive",
        });
      }
    },
    [grantEmissionPermissionTransaction, selectedAccount?.address, form, toast],
  );

  return (
    <Form {...form}>
      <form
        id="emission-permission-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6"
      >
        <WalletConnectionWarning
          isAccountConnected={isAccountConnected}
          isInitialized={isInitialized}
        />

        <div className="grid gap-6">
          <DistributionField
            form={form}
            isAccountConnected={isAccountConnected}
          />

          <DurationField form={form} isAccountConnected={isAccountConnected} />

          <RevocationField
            form={form}
            isAccountConnected={isAccountConnected}
          />

          <AllocationField
            api={api}
            form={form}
            isAccountConnected={isAccountConnected}
            selectedAccountAddress={selectedAccount?.address}
          />

          <TargetsField form={form} isAccountConnected={isAccountConnected} />

          <Button
            type="submit"
            form="emission-permission-form"
            className="w-full"
            variant="outline"
            disabled={!isAccountConnected || transactionStatus === "loading"}
          >
            {transactionStatus === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : !isAccountConnected ? (
              "Connect Wallet to Continue"
            ) : (
              "Delegate Emission Permission"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
