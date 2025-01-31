"use client";

import { BookText, Scale, Wallet, Zap } from "lucide-react";
import Link from "next/link";

import { toast } from "@torus-ts/toast-provider";
import {
  Dialog,
  DialogTrigger,
  Button,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  links,
  CopyButton,
} from "@torus-ts/ui";

import { ALLOCATOR_ADDRESS } from "~/consts";

export const tutorialData = {
  "1": {
    icon: <Wallet className="h-5 w-5" />,
    description: "Set Up Your Wallet",
    steps: [
      <p>
        Follow our{" "}
        <Link href={links.setup_a_wallet} className="text-cyan-500 underline">
          wallet setup guide
        </Link>{" "}
        to install and configure your wallet.
      </p>,
      "Connect your wallet to the Torus Network via the top-right menu.",
    ],
  },
  "2": {
    icon: <Zap className="h-5 w-5" />,
    description: "Stake on the Allocator",
    steps: [
      <p>
        Open the{" "}
        <Link href={links.wallet} className="text-cyan-500 underline">
          Wallet App
        </Link>
        .
      </p>,
      "Stake your desired amount to determine your voting power.",
      <CopyButton
        copy={ALLOCATOR_ADDRESS}
        variant="link"
        className="h-5 p-0 text-sm underline"
        notify={() => toast.success("Copied to clipboard")}
      >
        Click to copy the Allocator address.
      </CopyButton>,
      "Note: Staking does not spend your funds - it is only used to calculate voting power.",
    ],
  },
  "3": {
    icon: <Scale className="h-5 w-5" />,
    description: "Assign Weights to Agents",
    steps: [
      "Select your preferred Agent(s)",
      "Review your choices in the 'Allocation Menu'",
      "Click 'Submit Agents' to finalize your assignments.",
    ],
  },
};

export function TutorialDialog() {
  return (
    <Dialog>
      <Button asChild variant="outline">
        <DialogTrigger className="fixed bottom-4 right-52 z-50 md:bottom-14">
          <BookText />
          <p className="hidden md:block">Tutorial</p>
        </DialogTrigger>
      </Button>
      <DialogContent className="max-h-[100vh] overflow-auto sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Tutorial</DialogTitle>
          <DialogDescription>
            Getting Started with the Allocator.
          </DialogDescription>
        </DialogHeader>
        <div>
          {Object.entries(tutorialData).map(
            ([key, { icon, description, steps }]) => (
              <div key={key} className="mb-8 flex flex-col gap-4">
                <div className="flex items-center">
                  {icon}
                  <span className="ml-2 font-semibold">{description}</span>
                </div>
                <ul className="flex list-disc flex-col gap-1.5 pl-8 text-sm">
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
