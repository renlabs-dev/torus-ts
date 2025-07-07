"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { inferProcedureInput } from "@trpc/server";
import { useForm } from "react-hook-form";

import type { AppRouter } from "@torus-ts/api";
import { AGENT_DEMAND_SIGNAL_INSERT_SCHEMA } from "@torus-ts/db/validation";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { MarkdownView } from "@torus-ts/ui/components/markdown-view";
import { Slider } from "@torus-ts/ui/components/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

import { api } from "~/trpc/react";

type SignalFormData = NonNullable<
  inferProcedureInput<AppRouter["signal"]["create"]>
>;

export default function CreateSignalForm() {
  const { toast } = useToast();
  const { selectedAccount } = useTorus();

  const createSignalMutation = api.signal.create.useMutation();

  // Query for computed agent weights to check if user is an agent
  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    api.computedAgentWeight.all.useQuery();

  // Query for existing signals by this user
  const existingSignals = api.signal.byCreatorId.useQuery(
    { creatorId: selectedAccount?.address ?? "" },
    {
      enabled: !!selectedAccount?.address,
    },
  );

  // Check if the current user is an agent by looking for their address in computed weights
  const userComputedWeight = allComputedWeights?.find(
    (weight) => weight.agentKey === selectedAccount?.address,
  );
  const hasAgent = !!userComputedWeight;

  // Calculate total existing allocation
  const totalExistingAllocation =
    existingSignals.data?.reduce(
      (total, signal) => total + signal.proposedAllocation,
      0,
    ) ?? 0;

  // Calculate maximum allowed allocation for new signal
  const maxAllowedAllocation = Math.max(0, 100 - totalExistingAllocation);

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
    // Validate that the new allocation doesn't exceed the available amount
    if (data.proposedAllocation > maxAllowedAllocation) {
      toast.error(
        `Cannot allocate ${data.proposedAllocation}%. Only ${maxAllowedAllocation}% is available.`,
      );
      return;
    }

    if (data.proposedAllocation + totalExistingAllocation > 100) {
      toast.error("Total allocation cannot exceed 100%");
      return;
    }

    try {
      await createSignalMutation.mutateAsync(data);
      toast.success("Signal created successfully");
      form.reset();
      // Refetch existing signals to update the display
      await existingSignals.refetch();
    } catch (error) {
      console.error("Failed to create signal:", error);
      toast.error("Failed to create signal");
    }
  };

  return (
    <div className="w-full relative">
      {!hasAgent && !isLoadingWeights && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/80
            backdrop-blur-sm rounded-lg"
        >
          <Card className="border border-border/50 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Agent Registration Required
                </h3>
                <p className="text-muted-foreground mb-4">
                  You need to be a registered agent to create demand signals.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please register as an agent first to access this feature.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card
        className={`border-0
          ${!hasAgent && !isLoadingWeights ? "opacity-30 pointer-events-none" : ""}`}
      >
        <CardHeader>
          <CardTitle>Create Demand Signal</CardTitle>
          <CardDescription>
            Make a demand signal to express your specific need and proposed
            emission allocation to other agents.
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
                        maxLength={80}
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
                      <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="edit">Edit</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit">
                          <Textarea
                            maxLength={2000}
                            placeholder="Detailed description of your demand signal... (Markdown supported)"
                            className="min-h-[200px] resize-none"
                            {...field}
                          />
                        </TabsContent>
                        <TabsContent value="preview">
                          <div className="min-h-[200px] rounded-md border p-3 bg-muted/50">
                            {field.value ? (
                              <MarkdownView
                                source={field.value}
                                className="prose prose-sm dark:prose-invert max-w-none"
                              />
                            ) : (
                              <p className="text-muted-foreground text-sm">
                                No content to preview. Switch to Edit tab to add
                                content.
                              </p>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
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
                      <div>
                        <Slider
                          value={[field.value || 0]}
                          onValueChange={([value]) =>
                            field.onChange(
                              Math.min(value ?? 0, maxAllowedAllocation),
                            )
                          }
                          max={maxAllowedAllocation}
                          min={0}
                          step={1}
                          className="-mt-3 -mb-2"
                        />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            Available: {maxAllowedAllocation}%
                          </span>
                          <span className="text-md font-medium">
                            {field.value || 0}%
                          </span>
                        </div>
                        {totalExistingAllocation > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            You have already allocated {totalExistingAllocation}
                            % across {existingSignals.data?.length} signal
                            {existingSignals.data?.length !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display existing signals */}
              {existingSignals.data && existingSignals.data.length > 0 && (
                <div className="rounded-md border border-border bg-muted/30 p-4">
                  <h4 className="text-sm font-medium mb-3">
                    Your Existing Signals
                  </h4>
                  <div className="space-y-2">
                    {existingSignals.data.map((signal, index) => (
                      <div
                        key={signal.id || index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="truncate flex-1 mr-2">
                          {signal.title}:
                        </span>
                        <span className="font-medium">
                          {signal.proposedAllocation}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-3 pt-3 flex justify-between items-center text-sm font-medium">
                    <span>Total Allocated:</span>
                    <span>{totalExistingAllocation}%</span>
                  </div>
                  {maxAllowedAllocation === 0 && (
                    <div
                      className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200
                        dark:border-orange-800 rounded-md"
                    >
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        You have allocated 100% of your available percentage.
                        You cannot create new signals until you remove some
                        existing ones.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Contact Information{" "}
                  <span className="text-sm text-gray-500">(Recommended)</span>
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

              <div className="flex justify-end space-x-4 pb-12">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createSignalMutation.isPending ||
                    maxAllowedAllocation === 0 ||
                    !hasAgent ||
                    isLoadingWeights
                  }
                >
                  {createSignalMutation.isPending
                    ? "Creating..."
                    : maxAllowedAllocation === 0
                      ? "No Allocation Available"
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
