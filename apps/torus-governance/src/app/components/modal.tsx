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

export function CreateModal() {
  const [selectedView, setSelectedView] = useState("create-agent-application");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          title="Apply to be allowed to register an agent or module on the network"
        >
          <ClipboardPlus className="h-4 w-4" />
          Shape the network
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-svh w-full max-w-[100vw] gap-6 overflow-y-auto border-muted md:w-[80%] md:max-w-screen-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Shape the network
          </DialogTitle>
        </DialogHeader>
        <Select value={selectedView} onValueChange={setSelectedView}>
          <SelectTrigger className="w-full border-transparent bg-accent p-3 text-white">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent className="w-fit border-muted">
            <SelectItem value="create-agent-application">
              Apply to whitelist your agent
            </SelectItem>
            <SelectItem value="register-agent">
              Register a whitelisted agent
            </SelectItem>
            <SelectSeparator />
            <SelectItem value="create-proposal">Create new Proposal</SelectItem>
            <SelectItem value="create-transfer-dao-treasury">
              Create Transfer Dao Treasury Proposal
            </SelectItem>
          </SelectContent>
        </Select>
        {selectedView === "create-proposal" ? (
          <CreateProposal />
        ) : selectedView === "create-agent-application" ? (
          <CreateAgentApplication />
        ) : selectedView === "create-transfer-dao-treasury" ? (
          <CreateTransferDaoTreasuryProposal />
        ) : (
          <RegisterAgent />
        )}
      </DialogContent>
    </Dialog>
  );
}
