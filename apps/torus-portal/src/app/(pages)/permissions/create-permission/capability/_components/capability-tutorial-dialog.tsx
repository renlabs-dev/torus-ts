"use client";

import React from "react";

import { CheckCircle, Route, Settings } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@torus-ts/ui/components/alert-dialog";

import { useCapabilityTutorialStore } from "~/stores/capabilityTutorialStore";

export const capabilityTutorialData = {
  "1": {
    icon: <Route className="h-5 w-5" />,
    description: "Select your capability paths to re-delegate",
    steps: [
      <div key="own-paths" className="flex items-center gap-2">
        Your own paths:
        <div
          className="text-center px-1.5 py-1.5 rounded-sm text-xs bg-green-600 text-white border
            border-border"
        >
          <Route size={11} />
        </div>
        unlimited instances available
      </div>,
      <div key="delegated-paths" className="flex items-center gap-2">
        Delegated paths:
        <div
          className="text-center px-2 py-1 rounded-sm text-xs bg-blue-600 text-white border
            border-border"
        >
          5
        </div>
        limited to instances you received
      </div>,
    ],
  },
  "2": {
    icon: <Settings className="h-5 w-5" />,
    description: "Create the Permission",
    steps: [
      "Click 'Create Permission' on the bottom right",
      "Fill in the recipient (search by name or address)",
      "Set maximum instances and revocation terms",
    ],
  },
  "3": {
    icon: <CheckCircle className="h-5 w-5" />,
    description: "Finalize Your Re-delegation",
    steps: [
      "Review your selections in the permission form",
      "Click 'Create Capability Permission' to submit",
      "Sign the transaction in SubWallet to complete",
    ],
  },
};

export function CapabilityTutorialDialog() {
  const { isTutorialOpen, hasSeenTutorial, closeTutorial, markTutorialAsSeen } =
    useCapabilityTutorialStore();

  const handleClose = () => {
    closeTutorial();
    markTutorialAsSeen();
  };

  // Only show tutorial if user hasn't seen it yet
  const shouldShowTutorial = isTutorialOpen && !hasSeenTutorial;

  return (
    <AlertDialog open={shouldShowTutorial} onOpenChange={handleClose}>
      <AlertDialogContent className="max-h-[90vh] overflow-auto sm:max-w-[625px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Capability Permission Tutorial</AlertDialogTitle>
          <AlertDialogDescription>
            Learn how to create capability permissions for capability
            delegation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          {Object.entries(capabilityTutorialData).map(
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
        <div className="border-t pt-3">
          <div className="text-sm text-muted-foreground">
            Need more help? Check out the{" "}
            <a
              href="http://docs.torus.network/how-to-guides/builders/capability-permission/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 underline hover:text-cyan-400"
            >
              Capability Permission Guide
            </a>{" "}
            for detailed instructions.
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleClose} className="w-full">
            Got it! Let's create permissions
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
