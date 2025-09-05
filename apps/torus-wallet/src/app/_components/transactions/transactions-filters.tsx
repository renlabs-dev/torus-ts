"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@torus-ts/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@torus-ts/ui/components/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import type { TransactionQueryOptions } from "~/store/transactions-store";
import { ChevronDown, ChevronUp, FilterIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TransactionExport } from "./transaction-export";

const transactionsFilterSchema = z.object({
  type: z.string().optional(),
  fromAddress: z.string().optional(),
  toAddress: z.string().optional(),
  hash: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  orderBy: z.string().default("createdAt.desc"),
});

export type TransactionsFilterValues = TransactionQueryOptions;

interface TransactionFiltersProps {
  onFiltersChange: (filters: TransactionsFilterValues) => void;
  totalTransactions: number;
  currentCount: number;
  walletAddress?: string;
}

export function TransactionFilters({
  onFiltersChange,
  totalTransactions,
  currentCount,
  walletAddress,
}: TransactionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<TransactionsFilterValues>({
    resolver: zodResolver(transactionsFilterSchema),
    defaultValues: {
      type: undefined,
      fromAddress: undefined,
      toAddress: undefined,
      hash: undefined,
      startDate: undefined,
      endDate: undefined,
      orderBy: "createdAt.desc",
    },
  });

  const onSubmit = (data: TransactionsFilterValues) => {
    onFiltersChange(data);
    setIsOpen(false);
  };

  const handleReset = () => {
    form.reset();
    onFiltersChange({
      type: undefined,
      orderBy: "createdAt.desc",
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="space-y-2">
        <div className="flex items-center justify-end gap-2">
          <TransactionExport walletAddress={walletAddress} />
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filters
              {isOpen ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="text-muted-foreground text-xs" aria-live="polite">
          {currentCount} of {totalTransactions} transactions
        </div>
      </div>

      <CollapsibleContent className="mt-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 rounded-md border p-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "all" ? undefined : value)
                      }
                      value={field.value ?? "all"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[80]">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="send">Send</SelectItem>
                        <SelectItem value="transfer-stake">
                          Transfer Stake
                        </SelectItem>
                        <SelectItem value="stake">Stake</SelectItem>
                        <SelectItem value="unstake">Unstake</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fromAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="From address"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="To address"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Hash</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Transaction hash"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orderBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort By</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[80]">
                        <SelectItem value="createdAt.desc">
                          Newest First
                        </SelectItem>
                        <SelectItem value="createdAt.asc">
                          Oldest First
                        </SelectItem>
                        <SelectItem value="amount.desc">
                          Highest Amount
                        </SelectItem>
                        <SelectItem value="amount.asc">
                          Lowest Amount
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit">Apply Filters</Button>
            </div>
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  );
}
