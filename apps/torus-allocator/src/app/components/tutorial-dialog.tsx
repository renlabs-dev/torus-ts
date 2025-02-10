"use client";

import { Scale, Wallet, Zap } from "lucide-react";
import Link from "next/link";

import { toast } from "@torus-ts/toast-provider";
import {
  links,
  CopyButton,
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@torus-ts/ui";

import { ALLOCATOR_ADDRESS } from "~/consts";
import React, { useEffect } from "react";
import { useTutorialStore } from "~/stores/tutorialStore";

export const tutorialData = {
  "1": {
    icon: <Wallet className="h-5 w-5" />,
    description: "Set Up Your Wallet",
    steps: [
      <p key="1.1">
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
      <p key="2.1">
        Open the{" "}
        <Link href={links.wallet} className="text-cyan-500 underline">
          Wallet App
        </Link>
        .
      </p>,
      "Stake your desired amount to determine your voting power.",
      <CopyButton
        key="2.3"
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
  const {
    hasSeenTutorial,
    setHasSeenTutorial,
    shouldShowTutorial,
    setShouldShowTutorial,
  } = useTutorialStore();

  useEffect(() => {
    if (!hasSeenTutorial) {
      setShouldShowTutorial(true);
    }
  }, [hasSeenTutorial, setShouldShowTutorial]);

  const handleClose = () => {
    setShouldShowTutorial(false);
    setHasSeenTutorial(true);
  };

  return (
    <AlertDialog open={shouldShowTutorial} onOpenChange={setShouldShowTutorial}>
      <AlertDialogContent className="max-h-[90vh] overflow-auto sm:max-w-[625px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Tutorial</AlertDialogTitle>
          <AlertDialogDescription>
            Getting Started with the Allocator.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          {Object.entries(tutorialData).map(
            ([key, { icon, description, steps }]) => (
              <div key={key} className="flex flex-col gap-4 py-4">
                <div className="flex items-center">
                  {icon}
                  <span className="ml-2 font-semibold">{description}</span>
                </div>
                <ul className="flex list-disc flex-col gap-1.5 pl-8 text-sm">
                  {steps.map((step, index) => (
                    <li key={`${key}-step-${index}`}>
                      {typeof step === "string"
                        ? step
                        : React.cloneElement(step, {
                            key: `${key}-step-${index}`,
                          })}
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleClose} className="w-full">
            Got it!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
