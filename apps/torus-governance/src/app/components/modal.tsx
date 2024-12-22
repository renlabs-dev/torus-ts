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

// Adjust the import path as needed

import { CreateDao } from "./agent-application/create-agent-application";
import { CreateProposal } from "./proposal/create-proposal";
import { CreateTransferDaoTreasuryProposal } from "./proposal/create-transfer-dao-treasury-proposal";
import { RegisterAgent } from "./proposal/register-agent";

export function CreateModal() {
  const [selectedView, setSelectedView] = useState("proposal");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="hidden w-fit px-4 md:block"
          size="lg"
        >
          Propose Change
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
            <SelectItem value="proposal">Create new Proposal</SelectItem>
            <SelectItem value="dao">Create new S2 Application</SelectItem>
            <SelectItem value="create-transfer-dao-treasury">
              Create Transfer Dao Treasury Proposal
            </SelectItem>
            <SelectSeparator />
            <SelectItem value="register-module">Register a Module</SelectItem>
          </SelectContent>
        </Select>
        {selectedView === "proposal" ? (
          <CreateProposal />
        ) : selectedView === "dao" ? (
          <CreateDao />
        ) : selectedView === "create-transfer-dao-treasury" ? (
          <CreateTransferDaoTreasuryProposal />
        ) : (
          <RegisterAgent />
        )}
      </DialogContent>
    </Dialog>
  );
}
