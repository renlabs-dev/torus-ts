"use client";

import { useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui";

import { CreateAgentApplication } from "./agent-application/create-agent-application";
import { RegisterAgent } from "./proposal/register-agent";
import { CreateProposal } from "./proposal/create-proposal";
import { CreateTransferDaoTreasuryProposal } from "./proposal/create-transfer-dao-treasury-proposal";
import { ClipboardPlus } from "lucide-react";
import { useGovernance } from "~/context/governance-provider";

type ViewType =
  | "whitelist-agent"
  | "register-agent"
  | "create-proposal"
  | "create-transfer-dao-treasury-proposal";

interface ViewSpec {
  label: string;
  component: JSX.Element;
  separatorAfter?: boolean;
}

const viewList: Record<ViewType, ViewSpec> = {
  "whitelist-agent": {
    label: "Whitelist an agent",
    component: <CreateAgentApplication />,
  },
  "register-agent": {
    label: "Register an agent",
    component: <RegisterAgent />,
    separatorAfter: true,
  },
  "create-proposal": {
    label: "Create a proposal",
    component: <CreateProposal />,
  },
  "create-transfer-dao-treasury-proposal": {
    label: "Transfer DAO Treasury",
    component: <CreateTransferDaoTreasuryProposal />,
  },
};
export function CreateModal() {
  const { isInitialized } = useGovernance();
  const [selectedView, setSelectedView] = useState<ViewType>("whitelist-agent");

  const selectedFormAction = viewList[selectedView];

  return (
    <Dialog>
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
      <DialogContent className="max-h-[90%] w-full max-w-[100vw] gap-6 overflow-y-auto border-muted md:w-[80%] md:max-w-screen-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Shape the network
          </DialogTitle>
        </DialogHeader>
        <Select
          value={selectedView}
          onValueChange={(value) => setSelectedView(value as ViewType)}
        >
          <SelectTrigger className="w-full border-transparent bg-accent p-3 text-white">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>

          <SelectContent className="w-fit border-muted">
            {Object.entries(viewList).map(([view, spec]) => (
              <div key={view}>
                <SelectItem value={view as ViewType}>{spec.label}</SelectItem>
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
