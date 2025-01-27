"use client";

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

import { BookText, Scale, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { VALIDATOR_ADDRESS } from "./delegated-list";

export const tutorialData = {
  "1": {
    icon: <Wallet className="h-5 w-5" />,
    description: "Creating a wallet",
    steps: [
      "Install the polkadot.js or SubWallet browser extension.",
      "Create or import a wallet within the extension.",
      "Connect your wallet to the Torus Network using the menu in the top-right corner.",
      <p>
        You can find a detailed guide in our docs at{" "}
        <Link href={links.setup_a_wallet} className="text-blue-500 underline">
          Setup a wallet
        </Link>
        .
      </p>,
    ],
  },
  "2": {
    icon: <Zap className="h-5 w-5" />,
    description: "Staking on the Allocator",
    steps: [
      <p>
        Go to our{" "}
        <Link href={links.setup_a_wallet} className="text-blue-500 underline">
          Wallet App
        </Link>
        .
      </p>,
      <div className="sm:flex sm:items-center sm:gap-1.5">
        <p>Add the</p>{" "}
        <CopyButton
          copy={VALIDATOR_ADDRESS}
          variant="link"
          className="h-5 p-0 text-sm underline"
          notify={() => toast.success("Copied to clipboard")}
        >
          Allocator Address
        </CopyButton>{" "}
        <p>to your wallet.</p>
      </div>,
      "Stake the amount you want. This amount determines your voting power.",
      "Note: Your staked balance remains untouched - it's only used to calculate voting power.",
    ],
  },
  "3": {
    icon: <Scale className="h-5 w-5" />,
    description: "Assigning weights to Agents",
    steps: [
      "Select your preferred Agents.",
      "Review your choices in the 'Allocation Menu'.",
      "Click 'Submit Agents' to confirm your weight assignments.",
    ],
  },
};

export function TutorialDialog() {
  return (
    <Dialog>
      <Button asChild variant="outline">
        <DialogTrigger className="fixed bottom-14 right-52 z-50">
          <BookText />
          <p className="hidden md:block">Tutorial</p>
        </DialogTrigger>
      </Button>
      <DialogContent className="max-h-[100vh] overflow-auto sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Tutorial</DialogTitle>
          <DialogDescription>
            Learn how to interact with agents in the allocator.
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
