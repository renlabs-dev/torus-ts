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

import { BookText, LinkIcon, Scale, Wallet, Zap } from "lucide-react";
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
      <p className="flex items-center gap-1.5">
        Go to
        <Link href={links.wallet} className="flex items-center gap-2 underline">
          wallet.torus.network
          <LinkIcon size={14} />
        </Link>
      </p>,
      <p className="text-sm">
        Add the{" "}
        <CopyButton
          copy={"5Hgik8Kf7nq5VBtW41psbpXu1kinXpqRs4AHotPe6u1w6QX2"}
          variant="link"
          className="h-5 p-0 text-sm"
          notify={() => toast.success("Copied to clipboard")}
        >
          Validator Address
        </CopyButton>{" "}
        / Allocator Official Agent
      </p>,
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
      <Button asChild variant="outline">
        <DialogTrigger className="fixed bottom-4 left-4 z-50">
          <BookText />
          <p className="hidden md:block">Tutorial</p>
        </DialogTrigger>
      </Button>
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
