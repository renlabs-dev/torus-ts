"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@torus-ts/ui/components/collapsible";
import { Button } from "@torus-ts/ui/components/button";
import { ChevronDown, ChevronUp, FilterIcon } from "lucide-react";
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
import { useState } from "react";
import type { TransactionQueryOptions } from "~/store/transactions-store";

const transactionsFilterSchema = z.object({
  type: z.string().default("all"),
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
}

export function TransactionFilters({
  onFiltersChange,
  totalTransactions,
  currentCount,
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
      orderBy: "createdAt.desc",
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground" aria-live="polite">
          {currentCount} of {totalTransactions} transactions
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm">
            <FilterIcon className="h-4 w-4 mr-2" />
            Filters
            {isOpen ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 border p-4 rounded-md"
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
