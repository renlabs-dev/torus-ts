"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useState } from "react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@torus-ts/ui/components/alert-dialog";
import type {
  SS58Address,
  EmissionAllocation,
  DistributionControl,
  PermissionDuration,
  RevocationTerms,
  EnforcementAuthority,
} from "@torus-network/sdk";
import PortalNavigationTabs from "../_components/portal-navigation-tabs";
import { GrantEmissionPermissionFormComponent } from "./_components/grant-emission-permission-form";
import { grantEmissionPermissionSchema } from "./_components/grant-emission-permission-form-schema";
import type { GrantEmissionPermissionFormData } from "./_components/grant-emission-permission-form-schema";

// Helper to transform form data to SDK format
function transformFormDataToSDK(data: GrantEmissionPermissionFormData) {
  // Transform allocation
  let allocation: EmissionAllocation;
  if (data.allocation.type === "FixedAmount") {
    allocation = {
      FixedAmount: BigInt(parseFloat(data.allocation.amount) * 1e6), // Convert to micro units as bigint
    };
  } else {
    allocation = {
      Streams: data.allocation.streams.map((stream) => ({
        streamId: stream.streamId as `0x${string}`,
        percentage: parseFloat(stream.percentage),
      })),
    };
  }

  // Transform targets
  const targets = data.targets.map(
    (target) =>
      [target.account as SS58Address, parseInt(target.weight)] as [
        SS58Address,
        number,
      ],
  );

  // Transform distribution
  let distribution: DistributionControl;
  switch (data.distribution.type) {
    case "Manual":
      distribution = { Manual: null };
      break;
    case "Automatic":
      distribution = {
        Automatic: BigInt(parseFloat(data.distribution.threshold) * 1e6),
      };
      break;
    case "AtBlock":
      distribution = { AtBlock: parseInt(data.distribution.blockNumber) };
      break;
    case "Interval":
      distribution = { Interval: parseInt(data.distribution.blocks) };
      break;
    default:
      distribution = { Manual: null };
  }

  // Transform duration
  let duration: PermissionDuration;
  if (data.duration.type === "Indefinite") {
    duration = { Indefinite: null };
  } else {
    duration = { UntilBlock: parseInt(data.duration.blockNumber) };
  }

  // Transform revocation
  let revocation: RevocationTerms;
  switch (data.revocation.type) {
    case "Irrevocable":
      revocation = { Irrevocable: null };
      break;
    case "RevocableByGrantor":
      revocation = { RevocableByGrantor: null };
      break;
    case "RevocableByArbiters":
      revocation = {
        RevocableByArbiters: {
          accounts: data.revocation.accounts as SS58Address[],
          requiredVotes: BigInt(parseInt(data.revocation.requiredVotes)),
        },
      };
      break;
    case "RevocableAfter":
      revocation = { RevocableAfter: parseInt(data.revocation.blockNumber) };
      break;
    default:
      revocation = { Irrevocable: null };
  }

  // Transform enforcement
  let enforcement: EnforcementAuthority;
  if (data.enforcement.type === "None") {
    enforcement = { None: null };
  } else {
    enforcement = {
      ControlledBy: {
        controllers: data.enforcement.controllers as SS58Address[],
        requiredVotes: BigInt(parseInt(data.enforcement.requiredVotes)),
      },
    };
  }

  return {
    grantee: data.grantee,
    allocation,
    targets,
    distribution,
    duration,
    revocation,
    enforcement,
  };
}

export default function Page() {
  const { grantEmissionPermissionTransaction } = useTorus();
  const { toast } = useToast();
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const form = useForm<GrantEmissionPermissionFormData>({
    resolver: zodResolver(grantEmissionPermissionSchema),
    defaultValues: {
      grantee: "",
      allocation: {
        type: "FixedAmount",
        amount: "",
      },
      targets: [{ account: "", weight: "" }],
      distribution: {
        type: "Manual",
      },
      duration: {
        type: "Indefinite",
      },
      revocation: {
        type: "Irrevocable",
      },
      enforcement: {
        type: "None",
      },
    },
  });

  const handleSubmit = useCallback(
    async (data: GrantEmissionPermissionFormData) => {
      try {
        setTransactionStatus("loading");
        const transformedData = transformFormDataToSDK(data);

        await grantEmissionPermissionTransaction({
          ...transformedData,
          callback: (result) => {
            if (result.status === "SUCCESS" && result.finalized) {
              setTransactionStatus("success");
              setIsSuccessDialogOpen(true);
              // Reset form
              form.reset();
            } else if (result.status === "ERROR") {
              setTransactionStatus("error");
              toast({
                title: "Error",
                description:
                  result.message ?? "Failed to grant emission permission",
                variant: "destructive",
              });
            }
          },
          refetchHandler: async () => {
            // No-op for now, could be used to refetch data after transaction
          },
        });
      } catch (error) {
        console.error("Error granting permission:", error);
        setTransactionStatus("error");
        toast({
          title: "Error",
          description: "Failed to grant emission permission",
          variant: "destructive",
        });
      }
    },
    [grantEmissionPermissionTransaction, toast, form],
  );

  const mutation = {
    isPending: transactionStatus === "loading",
    mutate: handleSubmit,
  };

  return (
    <main className="min-h-screen overflow-auto bg-background">
      <div className="fixed top-[3.9rem] left-2 right-96 z-10">
        <PortalNavigationTabs />
      </div>
      <div className="pt-24 pb-12">
        <GrantEmissionPermissionFormComponent form={form} mutation={mutation} />
      </div>

      <AlertDialog
        open={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Permission Created Successfully!
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="py-4">
            <p className="mb-4">
              Your emission permission has been granted successfully. Now you
              can create constraints to define specific rules and conditions for
              this permission.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <AlertDialogAction
              onClick={() => {
                setIsSuccessDialogOpen(false);
                setTransactionStatus("idle");
              }}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              I'll do that later
            </AlertDialogAction>
            <Link href="/create-constraint">
              <AlertDialogAction className="bg-green-600 text-white hover:bg-green-700">
                Create a Constraint →
              </AlertDialogAction>
            </Link>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
