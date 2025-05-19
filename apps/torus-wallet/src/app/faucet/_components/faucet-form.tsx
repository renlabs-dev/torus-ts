import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
// import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { FaucetFormValues } from "./faucet-form-schema.ts";

interface FaucetFormProps {
  form: UseFormReturn<FaucetFormValues>;
  selectedAccount: { address: string } | null;
  transactionStatus: TransactionResult;
}

export function FaucetForm({ form, selectedAccount }: FaucetFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card className="animate-fade w-full p-6">
      <Form {...form}>
        <form ref={formRef} className="flex w-full flex-col gap-6">
          <FormField
            control={form.control}
            name="receiver"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Receiver address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={`eg. 5CoS1L...2tCACxf4n`}
                    disabled={!selectedAccount?.address}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* {transactionStatus.status && (
            <TransactionStatus
              status={transactionStatus.status}
              message={transactionStatus.message}
            />
          )} */}

          <Button
            type="button"
            variant="outline"
            // onClick={}
            disabled={!selectedAccount?.address}
          >
            Request TORUS Testnet Tokens
          </Button>
        </form>
      </Form>
    </Card>
  );
}
