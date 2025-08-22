"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { delegateNamespacePermission } from "@torus-network/sdk/chain";

import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { Button } from "@torus-ts/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

import { FormAddressField } from "~/app/_components/address-field";

import { DurationField } from "./create-capability-fields/duration-field";
import { RevocationField } from "./create-capability-fields/revocation-field";
import { SelectedPathsDisplay } from "./create-capability-fields/selected-paths-display";
import { useRevocationValidation } from "./create-capability-fields/use-revocation-validation";
import type { PathWithPermission } from "./create-capability-flow/create-capability-flow-types";
import type { CreateCapabilityPermissionFormData } from "./create-capability-permission-form-schema";
import { CREATE_CAPABILITY_PERMISSION_SCHEMA } from "./create-capability-permission-form-schema";
import { transformFormDataToSDK } from "./create-capability-permission-form-utils";

interface CreateCapabilityPermissionFormProps {
  selectedPaths?: string[];
  pathsWithPermissions?: PathWithPermission[];
  onSuccess?: () => void;
}

export function CreateCapabilityPermissionForm({
  selectedPaths = [],
  pathsWithPermissions = [],
  onSuccess,
}: CreateCapabilityPermissionFormProps) {
  const {
    isAccountConnected,
    selectedAccount,
    api,
    isInitialized,
    torusApi,
    wsEndpoint,
  } = useTorus();
  const { toast } = useToast();

  const { sendTx, isPending, isSigning } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Delegate Namespace Permission",
  });

  // Set up revocation validation
  const { validateRevocationStrength, hasParentPermissions } =
    useRevocationValidation({
      api: api ?? undefined,
      pathsWithPermissions,
    });

  const form = useForm<CreateCapabilityPermissionFormData>({
    resolver: zodResolver(CREATE_CAPABILITY_PERMISSION_SCHEMA),
    defaultValues: {
      recipient: "",
      namespacePaths: selectedPaths,
      duration: {
        type: "Indefinite",
      },
      revocation: {
        type: "RevocableByDelegator",
      },
      instances: "1",
    },
  });

  // Update form when selectedPaths change
  useEffect(() => {
    form.setValue("namespacePaths", selectedPaths);
  }, [selectedPaths, form]);

  async function handleSubmit(
    data: z.infer<typeof CREATE_CAPABILITY_PERMISSION_SCHEMA>,
  ) {
    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    if (data.namespacePaths.length === 0) {
      toast.error("No capability paths selected");
      return;
    }

    // Validate revocation strength before submitting
    if (hasParentPermissions) {
      const validationErrors = await validateRevocationStrength(data);
      if (validationErrors.length > 0) {
        toast.error("Please fix revocation strength issues before submitting");
        return;
      }
    }

    const transformedData = transformFormDataToSDK(data, pathsWithPermissions);

    const [sendErr, sendRes] = await sendTx(
      delegateNamespacePermission({
        api,
        ...transformedData,
      }),
    );

    if (sendErr !== undefined) {
      return; // Error already handled by sendTx
    }

    const { tracker } = sendRes;

    tracker.on("finalized", () => {
      onSuccess?.();
      form.reset();
    });
  }

  return (
    <Form {...form}>
      <form
        id="namespace-permission-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6"
      >
        <WalletConnectionWarning
          isAccountConnected={isAccountConnected}
          isInitialized={isInitialized}
        />

        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormAddressField
                field={field}
                label="Recipient"
                disabled={!isAccountConnected}
              />
            )}
          />

          {selectedPaths.length > 0 && (
            <SelectedPathsDisplay paths={selectedPaths} />
          )}

          <DurationField form={form} isAccountConnected={isAccountConnected} />

          <FormField
            control={form.control}
            name="instances"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Instances</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="1"
                    placeholder="1"
                    disabled={!isAccountConnected}
                  />
                </FormControl>
                <FormDescription>
                  The maximum number of instances that can be created under this
                  permission.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <RevocationField
            form={form}
            isAccountConnected={isAccountConnected}
            api={api ?? undefined}
            pathsWithPermissions={pathsWithPermissions}
          />

          <Button
            type="submit"
            form="namespace-permission-form"
            className="w-full"
            variant="outline"
            disabled={
              !isAccountConnected ||
              isPending ||
              isSigning ||
              selectedPaths.length === 0
            }
          >
            {isPending || isSigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating permission...
              </>
            ) : !isAccountConnected ? (
              "Connect Wallet to Continue"
            ) : selectedPaths.length === 0 ? (
              "No Capability Paths Selected"
            ) : (
              `Create Capability Permission (${selectedPaths.length} path${selectedPaths.length > 1 ? "s" : ""})`
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
