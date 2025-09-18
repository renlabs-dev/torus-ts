"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { delegateWalletStakePermission } from "@torus-network/sdk/chain";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { Button } from "@torus-ts/ui/components/button";
import { Checkbox } from "@torus-ts/ui/components/checkbox";
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
import { Label } from "@torus-ts/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@torus-ts/ui/components/radio-group";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";
import { FormAddressField } from "~/app/_components/address-field";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { WALLET_STAKE_PERMISSION_SCHEMA } from "./wallet-stake-permission-schema";

export function WalletStakePermissionForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { toast } = useToast();
  const {
    api,
    isAccountConnected,
    isInitialized,
    selectedAccount,
    torusApi,
    wsEndpoint,
  } = useTorus();

  const { sendTx, isPending, isSigning } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Delegate Wallet Stake Permission",
  });

  const form = useForm<z.infer<typeof WALLET_STAKE_PERMISSION_SCHEMA>>({
    resolver: zodResolver(WALLET_STAKE_PERMISSION_SCHEMA),
    defaultValues: {
      recipient: "",
      canTransferStake: false,
      exclusiveStakeAccess: false,
      duration: "indefinite",
      revocation: "irrevocable",
    },
  });

  const watchedDuration = form.watch("duration");
  const watchedRevocation = form.watch("revocation");

  async function handleSubmit(
    data: z.infer<typeof WALLET_STAKE_PERMISSION_SCHEMA>,
  ) {
    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    const duration =
      data.duration === "indefinite"
        ? { Indefinite: null }
        : { UntilBlock: data.untilBlock ?? 0 };

    let revocation;
    switch (data.revocation) {
      case "irrevocable":
        revocation = { Irrevocable: null };
        break;
      case "revocable_by_delegator":
        revocation = { RevocableByDelegator: null };
        break;
      case "revocable_after":
        revocation = { RevocableAfter: data.revocableAfterBlock ?? 0 };
        break;
    }

    const tx = delegateWalletStakePermission({
      api,
      recipient: data.recipient,
      stakeDetails: {
        canTransferStake: data.canTransferStake,
        exclusiveStakeAccess: data.exclusiveStakeAccess,
      },
      duration,
      revocation,
    });

    const [sendErr, sendRes] = await sendTx(tx);

    if (sendErr !== undefined) {
      return; // Error already handled by sendTx
    }

    const { tracker } = sendRes;

    tracker.on("finalized", () => {
      form.reset();
    });
  }

  return (
    <Form {...form}>
      <form
        {...props}
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("flex flex-col gap-6", className)}
      >
        <PortalFormHeader
          title="Create Wallet Stake Permission"
          description="Delegate wallet stake operations to another account with specific permissions."
        />
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
                label="Recipient Address"
                disabled={!isAccountConnected}
              />
            )}
          />
          <div className="space-y-4">
            <Label className="font-medium">Stake Permissions</Label>
            <FormField
              control={form.control}
              name="exclusiveStakeAccess"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!isAccountConnected}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Exclusive Delegation</FormLabel>
                    <FormDescription>
                      You (the delegator) will loose permission to unstake,
                      exclusively granting it to the recipient
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="canTransferStake"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!isAccountConnected}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Allow Stake Movement</FormLabel>
                    <FormDescription>
                      Allow the recipient to move stake delegation between
                      agents
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Duration</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-1"
                    disabled={!isAccountConnected}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="indefinite" id="indefinite" />
                      <Label htmlFor="indefinite">Indefinite</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="until_block" id="until_block" />
                      <Label htmlFor="until_block">Until Block</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {watchedDuration === "until_block" && (
            <div className="animate-fade-down">
              <FormField
                control={form.control}
                name="untilBlock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Block Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="1000000"
                        disabled={!isAccountConnected}
                      />
                    </FormControl>
                    <FormDescription>
                      Permission will expire at this block number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          <FormField
            control={form.control}
            name="revocation"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Revocation Terms</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-1"
                    disabled={!isAccountConnected}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="irrevocable" id="irrevocable" />
                      <Label htmlFor="irrevocable">Irrevocable</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="revocable_by_delegator"
                        id="revocable_by_delegator"
                      />
                      <Label htmlFor="revocable_by_delegator">
                        Revocable by Delegator
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="revocable_after"
                        id="revocable_after"
                      />
                      <Label htmlFor="revocable_after">Revocable After</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {watchedRevocation === "revocable_after" && (
            <div className="animate-fade-down">
              <FormField
                control={form.control}
                name="revocableAfterBlock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revocable After Block</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="500000"
                        disabled={!isAccountConnected}
                      />
                    </FormControl>
                    <FormDescription>
                      Permission can be revoked after this block number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            type="submit"
            disabled={
              !isAccountConnected ||
              (watchedDuration === "until_block" &&
                !form.watch("untilBlock")) ||
              (watchedRevocation === "revocable_after" &&
                !form.watch("revocableAfterBlock")) ||
              isPending ||
              isSigning
            }
          >
            {isPending || isSigning
              ? "Creating Permission..."
              : "Create Wallet Stake Permission"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
