"use client";

import {
  Dialog,
  DialogTrigger,
  Button,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  links,
} from "@torus-ts/ui";

import { BookText, Scale, Wallet, Zap } from "lucide-react";
import Link from "next/link";

export const tutorialData = {
  "1": {
    icon: <Wallet className="h-5 w-5" />,
    description: "Creating a wallet",
    steps: [
      "Install the polkadot.js or SubWallet browser extension",
      "Create a new wallet within the extension",
      "Connect your wallet to the Torus Network using the top-right menu",
    ],
  },
  "2": {
    icon: <Zap className="h-5 w-5" />,
    description: "Staking on the Allocator",
    steps: [
      <>
        Go to{" "}
        <Link href={links.wallet} className="underline">
          wallet.torus.network
        </Link>
      </>,
      "Add this validator address: (5Hgik8Kf7nq5VBtW41psbpXu1kinXpqRs4AHotPe6u1w6QX2 / Allocator Official Agent) ",
      "Stake your desired amount (this determines your allocation power for Agents).",
      "Note: Your staked balance remains untouched; it only represents your voting power",
    ],
  },
  "3": {
    icon: <Scale className="h-5 w-5" />,
    description: "Assigning weights to Agents",
    steps: [
      "Select your preferred Agents",
      "Review your selected modules in 'Allocation Menu'",
      "Click 'Submit Agents' to confirm your weight assignments",
    ],
  },
};

export function TutorialDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild className="fixed bottom-4 right-52 z-50">
        <Button variant="outline">
          <BookText />
          Tutorial
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Tutorial</DialogTitle>
          <DialogDescription>
            Learn how to interact with agents in the allocator.
          </DialogDescription>
        </DialogHeader>
        <div>
          {Object.entries(tutorialData).map(
            ([key, { icon, description, steps }]) => (
              <div key={key} className="mb-4">
                <div className="mb-2 flex items-center">
                  {icon}
                  <span className="ml-2 font-semibold">{description}</span>
                </div>
                <ul className="list-disc break-words pl-6 text-sm">
                  {steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
