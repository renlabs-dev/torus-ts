import type { SS58Address } from "@torus-network/sdk/types";
import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@torus-ts/ui/components/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { FaucetFormValues } from "./faucet-form-schema";

interface FaucetFormProps {
  form: UseFormReturn<FaucetFormValues>;
  selectedAccount: { address: string } | null;
  isLoading: boolean;
  loadMessage: string;
  onSubmit: (amount: number) => Promise<void>;
}

export function FaucetForm({
  form,
  selectedAccount,
  onSubmit,
  isLoading,
  loadMessage,
}: FaucetFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);
  const { toast } = useToast();

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      setWidth(containerRef.current?.offsetWidth ?? 0);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  const handleSelfClick = () => {
    if (!selectedAccount?.address) {
      toast.error("No account found. Is your wallet connected?");
      return;
    }

    form.setValue("recipient", selectedAccount.address as SS58Address);
  };

  const handleSubmit = async (amount: number) => await onSubmit(amount);

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
                  <div className="flex gap-2">
                    <Input
                      {...field}
                      placeholder={`eg. 5CoS1L...2tCACxf4n`}
                      disabled={!selectedAccount?.address || isLoading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!selectedAccount?.address || isLoading}
                      onClick={handleSelfClick}
                    >
                      Self
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div ref={containerRef} className="flex flex-row">
            <Button
              className="flex-grow"
              type="button"
              variant="outline"
              disabled={!selectedAccount?.address || isLoading}
              onClick={() => handleSubmit(1)}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin" /> {loadMessage}{" "}
                </>
              ) : (
                <>Submit Faucet Request (50 TORUS)</>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedAccount?.address || isLoading}
                >
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" style={{ width }}>
                <DropdownMenuItem onClick={() => handleSubmit(2)}>
                  Submit 2x Faucet Requests (100 TORUS)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSubmit(10)}>
                  Submit 10x Faucet Requests (500 TORUS)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSubmit(20)}>
                  Submit 20x Faucet Requests (1000 TORUS)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </form>
      </Form>
    </Card>
  );
}
