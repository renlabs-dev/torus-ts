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

export function CreateModal() {
  const [selectedView, setSelectedView] = useState("create-proposal");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="hidden w-fit px-4 md:block bg-accent/80 text-foreground hover:text-accent/80 hover:bg-foreground"
          size="lg"
        >
          Create Agent Application
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[100%] max-w-screen-xl gap-6 border-muted md:w-[80%]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Propose Change
          </DialogTitle>
        </DialogHeader>
        <Select value={selectedView} onValueChange={setSelectedView}>
          <SelectTrigger className="w-2/4 border-transparent bg-accent p-3 text-white">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent className="border-muted">
            <SelectItem value="create-proposal">Create new Proposal</SelectItem>
            <SelectItem value="create-transfer-dao-treasury">
              Create Transfer Dao Treasury Proposal
            </SelectItem>
            <SelectSeparator />
            <SelectItem value="create-agent-application">
              Create an Agent Application
            </SelectItem>
            <SelectItem value="register-agent">Register an Agent</SelectItem>
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
