"use client";

import { useEffect, useState } from "react";

import { ClipboardPlus, Coins, FileText, Grid2x2Plus } from "lucide-react";

import { trySync } from "@torus-network/torus-utils/try-catch";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import {
  WalletConnectionWarning,
} from "@torus-ts/ui/components/wallet-connection-warning";

import { useGovernance } from "~/context/governance-provider";

import {
  CreateAgentApplication,
} from "./agent-application/create-agent-application";
import { AddEmissionProposalForm } from "./proposal/add-emission-proposal";
import { CreateProposal } from "./proposal/create-proposal";
import {
  CreateTransferDaoTreasuryProposal,
} from "./proposal/create-transfer-dao-treasury-proposal";

type ViewType =
  | "whitelist-agent"
  | "create-proposal"
  | "create-emission-proposal"
  | "create-transfer-dao-treasury-proposal";

interface ViewSpec {
  label: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  separatorAfter?: boolean;
}

const viewList: Record<ViewType, ViewSpec> = {
  "whitelist-agent": {
    label: "Whitelist an agent",
    description:
      "Submit an application to whitelist and receive emissions from root",
    icon: <Grid2x2Plus className="h-4 w-4 text-purple-500" />,
    component: <CreateAgentApplication />,
  },
  "create-proposal": {
    label: "Create a proposal",
    description: "Submit a new governance proposal",
    icon: <FileText className="h-4 w-4 text-blue-500" />,
    component: <CreateProposal />,
  },
  "create-emission-proposal": {
    label: "Create emission proposal",
    description: "Propose network emission parameter changes",
    icon: <Coins className="h-4 w-4 text-green-500" />,
    component: <AddEmissionProposalForm />,
  },
  "create-transfer-dao-treasury-proposal": {
    label: "Transfer DAO Treasury",
    description: "Propose a treasury transfer",
    icon: <Coins className="h-4 w-4 text-yellow-500" />,
    component: <CreateTransferDaoTreasuryProposal />,
  },
};
export function ShapeNetworkModal() {
  const { isAccountConnected } = useTorus();
  const { isInitialized } = useGovernance();
  const [selectedView, setSelectedView] = useState<ViewType>("whitelist-agent");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const [shouldBeError, shouldBeOpen] = trySync(
      () => sessionStorage.getItem("shapeNetworkModalOpen") === "true",
    );
    if (shouldBeError !== undefined) {
      console.error("Error reading sessionStorage:", shouldBeError);
      return;
    }
    if (shouldBeOpen) {
      setIsOpen(true);
      sessionStorage.removeItem("shapeNetworkModalOpen");
    }
  }, []);

  // Save dialog state before any authentication
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      sessionStorage.removeItem("shapeNetworkModalOpen");
    }
    setIsOpen(open);
  };

  const selectedFormAction = viewList[selectedView];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={!isInitialized}>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          title="Apply to be allowed to register an agent or module on the network"
        >
          <ClipboardPlus className="h-4 w-4" />
          Shape the network
        </Button>
      </DialogTrigger>
      <DialogContent
        className="border-muted max-h-[80%] w-full max-w-[100vw] gap-6 overflow-y-auto md:w-[80%]
          md:max-w-screen-xl"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Shape the network
          </DialogTitle>
        </DialogHeader>

        <WalletConnectionWarning isAccountConnected={isAccountConnected} />

        <Select
          value={selectedView}
          onValueChange={(value) => setSelectedView(value as ViewType)}
        >
          <SelectTrigger className="w-full py-7">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>

          <SelectContent className="border-muted w-fit">
            {Object.entries(viewList).map(([view, spec]) => (
              <div key={view}>
                <SelectItem
                  value={view as ViewType}
                  className="flex flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-2">
                    {spec.icon}
                    <span>{spec.label}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {spec.description}
                  </span>
                </SelectItem>
                {spec.separatorAfter && <SelectSeparator />}
              </div>
            ))}
          </SelectContent>
        </Select>
        {selectedFormAction.component}
      </DialogContent>
    </Dialog>
  );
}
