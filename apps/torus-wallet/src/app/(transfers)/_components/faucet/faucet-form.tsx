import type { UseFormReturn } from "react-hook-form";
import type { FaucetFormValues } from "./faucet-form-schema";
import { Card } from "@torus-ts/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import type { Dispatch, SetStateAction } from "react";
import { useRef } from "react";
import { Input } from "@torus-ts/ui/components/input";
import { Button } from "@torus-ts/ui/components/button";
import { useWallet } from "~/context/wallet-provider";
import ReCAPTCHA from "react-google-recaptcha";
import { env } from "~/env";

interface FaucetFormProps {
  form: UseFormReturn<FaucetFormValues>;
  selectedAccount: { address: string } | null;
  setToken: Dispatch<SetStateAction<string | null>>;
  onSubmit: () => Promise<void>;
}

export function FaucetForm({ form, selectedAccount, onSubmit, setToken}: FaucetFormProps) {
  const { accountFreeBalance } = useWallet();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card className="animate-fade w-full p-6">
      <Form {...form}>
        <form ref={formRef} className="flex w-full flex-col gap-6">
          <FormField
            control={form.control}
            name="recipient"
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

{/* {selectedAccount !== null && true && ( */}
          {selectedAccount !== null && (accountFreeBalance.data ?? 0) == 0 && (
            <div className="w-full flex justify-center">
              <ReCAPTCHA
              theme="dark"
                sitekey={env("NEXT_PUBLIC_RECAPTCHA_SITE_ID")}
                onChange={(token: string | null) =>
                  setToken(token)
                }
              />
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            disabled={!selectedAccount?.address}
            onClick={onSubmit}
          >
            Submit Faucet Request
          </Button>
        </form>
      </Form>
    </Card>
  );
}
