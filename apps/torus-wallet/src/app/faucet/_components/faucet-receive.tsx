"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useWallet } from "~/context/wallet-provider";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@torus-ts/ui/components/card";
import { Button } from "@torus-ts/ui/components/button";
import { createFaucetFormSchema } from "./faucet-form-schema";
import type { FaucetFormValues } from "./faucet-form-schema";
import { FaucetForm } from "./faucet-form";
import type { SS58Address } from "@torus-network/sdk";

export function Faucet() {
  const { selectedAccount } = useWallet();

  const [transactionStatus] = useState<TransactionResult>({
    status: null,
    message: null,
    finalized: false,
  });

  const form = useForm<FaucetFormValues>({
    resolver: zodResolver(createFaucetFormSchema()),
    defaultValues: {
      receiver: "",
      requester: "",
    },
    mode: "onTouched",
  });

  const { setValue } = form;

  useEffect(() => {
    if (selectedAccount?.address) {
      setValue("requester", selectedAccount.address as SS58Address);
    }
  }, [selectedAccount, setValue]);

  const handlePasteAddress = () => {
    if (selectedAccount?.address) {
      setValue("receiver", selectedAccount.address as SS58Address);
      // Trigger validation
      void form.trigger("receiver");
    }
  };

  return (
    <Card
      className="flex flex-col items-start justify-center gap-4 p-6 shadow-md hover:shadow-lg
        transition-shadow duration-300"
    >
      <h3 className="text-lg font-semibold">Receive TORUS on the Testnet</h3>
      <p className="text-left text-muted-foreground">
        Paste the address to receive TORUS on the testnet.
      </p>

      <div className="flex-col w-full flex-wrap">
        <div className="flex gap-4">
          <FaucetForm
            form={form}
            selectedAccount={selectedAccount}
            transactionStatus={transactionStatus}
          />

          {selectedAccount?.address ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePasteAddress}
              disabled={!selectedAccount.address}
              className="mb-4"
            >
              Paste your address
            </Button>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </Card>
  );
}
