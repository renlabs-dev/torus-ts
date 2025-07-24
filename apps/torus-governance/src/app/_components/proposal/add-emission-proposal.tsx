"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFileUploader } from "hooks/use-file-uploader";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { tryAsync } from "@torus-network/torus-utils/try-catch";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
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
import { Textarea } from "@torus-ts/ui/components/text-area";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";

const ADD_EMISSION_PROPOSAL_SCHEMA = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  recyclingPercentage: z
    .number()
    .min(0, "Recycling percentage must be at least 0")
    .max(100, "Recycling percentage cannot exceed 100"),
  treasuryPercentage: z
    .number()
    .min(0, "Treasury percentage must be at least 0")
    .max(100, "Treasury percentage cannot exceed 100"),
  incentivesRatio: z
    .number()
    .min(0, "Incentives ratio must be at least 0")
    .max(100, "Incentives ratio cannot exceed 100"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
});

type AddEmissionProposalFormData = z.infer<typeof ADD_EMISSION_PROPOSAL_SCHEMA>;

interface AddEmissionProposalFormProps extends React.ComponentProps<"form"> {
  onSuccess?: () => void;
}

export function AddEmissionProposalForm({
  className,
  onSuccess,
  ...props
}: AddEmissionProposalFormProps) {
  const { isAccountConnected, isInitialized, addEmissionProposal } = useTorus();
  const { toast } = useToast();
  const { uploadFile, uploading } = useFileUploader();

  const form = useForm<AddEmissionProposalFormData>({
    resolver: zodResolver(ADD_EMISSION_PROPOSAL_SCHEMA),
    defaultValues: {
      title: "",
      recyclingPercentage: 0,
      treasuryPercentage: 0,
      incentivesRatio: 0,
      description: "",
    },
  });

  const { control, handleSubmit } = form;

  async function handleFileUpload(fileToUpload: File): Promise<void> {
    const { success, cid } = await uploadFile(fileToUpload, {
      errorMessage: "Error uploading emission proposal metadata",
    });

    if (!success || !cid) return;

    const ipfsUri = `ipfs://${cid}`;
    const formData = form.getValues();

    const [error] = await tryAsync(
      addEmissionProposal({
        recyclingPercentage: formData.recyclingPercentage,
        treasuryPercentage: formData.treasuryPercentage,
        incentivesRatio: formData.incentivesRatio,
        data: ipfsUri,
        callback: (result) => {
          if (result.status === "SUCCESS" && result.finalized) {
            toast.success("Emission proposal created successfully");
            form.reset();
            onSuccess?.();
          }

          if (result.status === "ERROR") {
            toast.error(result.message ?? "Failed to create emission proposal");
          }
        },
        refetchHandler: async () => {
          // Refetch proposals if needed
        },
      }),
    );

    if (error) {
      toast.error(error.message || "Error creating emission proposal");
      return;
    }
  }

  async function onSubmit(data: AddEmissionProposalFormData) {
    // Validate that percentages add up to 100
    const total =
      data.recyclingPercentage + data.treasuryPercentage + data.incentivesRatio;
    if (total !== 100) {
      toast.error(
        "Recycling, treasury, and incentives percentages must add up to 100%",
      );
      return;
    }

    // Create metadata JSON with title, description, and emission parameters
    const proposalMetadata = JSON.stringify({
      title: data.title,
      body: data.description,
      emissionParameters: {
        recyclingPercentage: data.recyclingPercentage,
        treasuryPercentage: data.treasuryPercentage,
        incentivesRatio: data.incentivesRatio,
      },
      type: "emission_proposal",
      version: "1.0.0",
    });

    const blob = new Blob([proposalMetadata], { type: "application/json" });
    const fileToUpload = new File([blob], "emission-proposal.json", {
      type: "application/json",
    });

    await handleFileUpload(fileToUpload);
  }

  return (
    <Form {...form}>
      <form
        {...props}
        onSubmit={handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Create Emission Proposal</h2>
          <p className="text-muted-foreground">
            Submit a proposal to modify network emission parameters. All
            percentages must add up to 100%.
          </p>
        </div>

        <WalletConnectionWarning
          isAccountConnected={isAccountConnected}
          isInitialized={isInitialized}
        />

        <div className="grid gap-6">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proposal Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter a descriptive title for your emission proposal"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A clear, concise title describing the proposed emission
                  changes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={control}
              name="recyclingPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recycling Percentage</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Percentage allocated to recycling
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="treasuryPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treasury Percentage</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Percentage allocated to treasury
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="incentivesRatio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incentives Ratio</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Percentage allocated to incentives
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the rationale for these emission parameter changes..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Detailed explanation of the proposal and its benefits (10-1000
                  characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={!isAccountConnected || uploading}
          >
            <Plus className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Create Emission Proposal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
