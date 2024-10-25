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
  Separator,
} from "@commune-ts/ui";

// Adjust the import path as needed

import { CreateDao } from "./dao/create-dao";
import { CreateProposal } from "./proposal/create-proposal";
import { CreateTransferDaoTreasuryProposal } from "./proposal/create-transfer-dao-treasury-proposal";
import { RegisterModule } from "./proposal/register-module";

export function CreateModal() {
  const [selectedView, setSelectedView] = useState("proposal");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" size="xl">
          Propose Change
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[100%] max-w-screen-xl md:w-[80%]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Propose Change
          </DialogTitle>
        </DialogHeader>
        <Select value={selectedView} onValueChange={setSelectedView}>
          <SelectTrigger className="w-full border-transparent bg-white/10 p-3 text-white">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="proposal">Create new Proposal</SelectItem>
            <SelectItem value="dao">Create new S2 Application</SelectItem>
            <SelectItem value="create-transfer-dao-treasury">
              Create Transfer Dao Treasury Proposal
            </SelectItem>
            <SelectSeparator />
            <SelectItem value="register-module">Register a Module</SelectItem>
          </SelectContent>
        </Select>
        <Separator />
        {selectedView === "proposal" ? (
          <CreateProposal />
        ) : selectedView === "dao" ? (
          <CreateDao />
        ) : selectedView === "create-transfer-dao-treasury" ? (
          <CreateTransferDaoTreasuryProposal />
        ) : (
          <RegisterModule />
        )}
      </DialogContent>
    </Dialog>
  );
}
