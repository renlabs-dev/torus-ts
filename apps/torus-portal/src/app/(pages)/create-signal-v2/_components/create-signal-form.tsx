"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Radio } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { AGENT_DEMAND_SIGNAL_INSERT_SCHEMA } from "@torus-ts/db/validation";
import { Button } from "@torus-ts/ui/components/button";
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
import { cn } from "@torus-ts/ui/lib/utils";

import { api } from "~/trpc/react";
import { tryCatch } from "~/utils/try-catch";

import { CreateSignalMarkdownField } from "./create-signal-markdown-field";
import { CreateSignalSliderField } from "./create-signal-slider-field";

export function CreateSignalForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof AGENT_DEMAND_SIGNAL_INSERT_SCHEMA>>({
    resolver: zodResolver(AGENT_DEMAND_SIGNAL_INSERT_SCHEMA),
    defaultValues: {
      title: "",
      description: "",
      proposedAllocation: 0,
      discord: "",
      github: "",
      telegram: "",
      twitter: "",
    },
  });

  const createSignalMutation = api.signal.create.useMutation();

  async function onSubmit(
    data: z.infer<typeof AGENT_DEMAND_SIGNAL_INSERT_SCHEMA>,
  ) {
    console.log("data", data);

    const { error } = await tryCatch(createSignalMutation.mutateAsync(data));

    if (error) {
      console.error("Error creating signal:", error);
      toast.error(error.message);

      return;
    }

    toast({
      title: "You submitted the following values",
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form
        {...props}
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-bold">Create Signal</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Make a demand signal to express your specific need and proposed
            emission allocation to other agents.
          </p>
        </div>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id="title"
                      className="w-full"
                      placeholder="e.g. Bridge between Discord and X"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <CreateSignalMarkdownField field={field} />
              )}
            />
          </div>

          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="proposedAllocation"
              render={({ field }) => <CreateSignalSliderField field={field} />}
            />
          </div>

          <div
            className="after:border-border relative text-center text-sm after:absolute after:inset-0
              after:top-1/2 after:z-0 after:flex after:items-center after:border-t"
          >
            <span className="bg-[#131315] text-muted-foreground relative z-10 px-2">
              Contact Information
            </span>
          </div>
          <Button variant="outline" className="w-full" type="submit">
            <Radio className="w-4 h-4 mr-1" />
            Create Signal
          </Button>
        </div>
      </form>
    </Form>
  );
}
