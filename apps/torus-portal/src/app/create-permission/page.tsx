"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback } from "react";
import PortalNavigationTabs from "../_components/portal-navigation-tabs";
import { GrantEmissionPermissionFormComponent } from "./_components/grant-emission-permission-form";
import { grantEmissionPermissionSchema } from "./_components/grant-emission-permission-form-schema";
import type { GrantEmissionPermissionFormData } from "./_components/grant-emission-permission-form-schema";

// Helper to transform form data to SDK format
function transformFormDataToSDK(data: GrantEmissionPermissionFormData) {
  // Transform allocation
  let allocation;
  if (data.allocation.type === "FixedAmount") {
    allocation = {
      FixedAmount: parseFloat(data.allocation.amount) * 1e6, // Convert to micro units
    };
  } else {
    allocation = {
      Streams: data.allocation.streams.map((stream) => ({
        streamId: stream.streamId,
        percentage: parseFloat(stream.percentage),
      })),
    };
  }

  // Transform targets
  const targets = data.targets.map((target) => [
    target.account,
    parseInt(target.weight),
  ]);

  // Transform distribution
  let distribution;
  switch (data.distribution.type) {
    case "Manual":
      distribution = { Manual: null };
      break;
    case "Automatic":
      distribution = {
        Automatic: parseFloat(data.distribution.threshold) * 1e6,
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
  let duration;
  if (data.duration.type === "Indefinite") {
    duration = { Indefinite: null };
  } else {
    duration = { UntilBlock: parseInt(data.duration.blockNumber) };
  }

  // Transform revocation
  let revocation;
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
          accounts: data.revocation.accounts,
          requiredVotes: parseInt(data.revocation.requiredVotes),
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
  let enforcement;
  if (data.enforcement.type === "None") {
    enforcement = { None: null };
  } else {
    enforcement = {
      ControlledBy: {
        controllers: data.enforcement.controllers,
        requiredVotes: parseInt(data.enforcement.requiredVotes),
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
        const transformedData = transformFormDataToSDK(data);

        await grantEmissionPermissionTransaction({
          ...transformedData,
          callback: (result) => {
            if (result.status.isInBlock || result.status.isFinalized) {
              toast({
                title: "Success",
                description: "Emission permission granted successfully",
              });
              // Reset form
              form.reset();
            }
          },
        });
      } catch (error) {
        console.error("Error granting permission:", error);
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
    isPending: false, // We could add a state for this if needed
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
    </main>
  );
}
