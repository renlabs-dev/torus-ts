"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { api } from "~/trpc/react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import type { AppRouter } from "@torus-ts/api";
import type { inferProcedureInput } from "@trpc/server";
import { Input } from "@torus-ts/ui/components/input";
import { AGENT_DEMAND_SIGNAL_INSERT_SCHEMA } from "@torus-ts/db/validation";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

type SignalFormData = NonNullable<
  inferProcedureInput<AppRouter["signal"]["create"]>
>;

export default function CreateSignalForm() {
  const { toast } = useToast();

  const createSignalMutation = api.signal.create.useMutation();

  const form = useForm<SignalFormData>({
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

  const onSubmit = async (data: SignalFormData) => {
    try {
      await createSignalMutation.mutateAsync(data);
      toast.success("Signal created successfully");
      form.reset();
    } catch (error) {
      console.error("Failed to create signal:", error);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <Card className="border-0">
        <CardHeader>
          <CardTitle>Create Demand Signal</CardTitle>
          <CardDescription>
            Submit a demand signal to express your needs and proposed
            allocation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief title for your demand signal"
                        maxLength={100}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        maxLength={8000}
                        placeholder="Detailed description of your demand signal..."
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proposedAllocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed Allocation (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || "0")
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Contact Information (Optional)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discord"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discord</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Discord username (e.g., username)"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="github"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="GitHub username (e.g., octocat)"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telegram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telegram</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Telegram username (e.g., @username)"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Twitter handle (e.g., @username)"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={createSignalMutation.isPending}>
                  {createSignalMutation.isPending
                    ? "Creating..."
                    : "Create Signal"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
