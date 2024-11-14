"use client";

import React from "react";
import Link from "next/link";
import { Grid2X2, Scale, SquareStack, Wallet, Zap } from "lucide-react";

import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";
import { Button } from "@torus-ts/ui";
import { copyToClipboard } from "@torus-ts/ui/utils";

function handleCopyClick(text: string) {
  copyToClipboard(text);
  toast.success("Copied validator address to clipboard");
}

export const tutorialData = {
  "1": {
    icon: <Wallet className="h-5 w-5" />,
    description: "Creating a wallet",
    steps: [
      "Install the polkadot.js or SubWallet browser extension",
      "Create a new wallet within the extension",
      "Connect your wallet to the torus AI network using the top-right menu",
    ],
  },
  "2": {
    icon: <Zap className="h-5 w-5" />,
    description: "Staking on the Community Validator",
    steps: [
      "Navigate to the staking tab in your wallet",
      <div key="validator-address" className="flex items-center">
        <span>Add this validator address: </span>
        <Button
          variant="link"
          className="px-1 text-base text-green-500"
          onClick={() =>
            handleCopyClick("5Hgik8Kf7nq5VBtW41psbpXu1kinXpqRs4AHotPe6u1w6QX2")
          }
        >
          Copy Validator Address
        </Button>
        <span>
          (5Hgik8Kf7nq5VBtW41psbpXu1kinXpqRs4AHotPe6u1w6QX2 / Community
          Validator official validator)
        </span>
      </div>,
      "Stake your desired amount (this determines your allocation power for modules and subnets)",
      "Note: Your staked balance remains untouched; it only represents your voting power",
    ],
  },
  "3": {
    icon: <Scale className="h-5 w-5" />,
    description: "Assigning weights to modules or subnets",
    steps: [
      "Visit the modules page and select your preferred modules",
      "Review your selected modules in 'Your Modules List'",
      "Click 'Submit' to confirm your weight assignments",
    ],
  },
};

const TutorialPage = () => {
  const { handleGetWallets, handleWalletModal } = useTorus();

  const handleConnectWallet = async () => {
    await handleGetWallets();
    handleWalletModal();
  };
  return (
    <div className="mx-auto max-w-screen-2xl px-4">
      <div className="ml-4 min-h-screen animate-fade-down border-l border-dashed p-4 text-white">
        <div className="my-20 ml-4 flex flex-col gap-3">
          <h3 className="inline-flex w-fit animate-fade-down border border-white/20 bg-[#898989]/5 px-2 py-0.5 animate-delay-200 md:text-xl">
            How to use the Community Validator
          </h3>
          <h1 className="animate-fade-down text-2xl font-semibold animate-delay-500 md:text-4xl">
            Learn how to interact with modules / subnets created by the{" "}
            <span className="text-green-600">community</span>.
          </h1>
        </div>
        <div className="mb-12">
          {Object.entries(tutorialData).map(([key, item], index) => (
            <div
              key={key}
              className="mb-8 flex animate-fade-down items-start animate-delay-1000"
            >
              <div className="mr-4 flex flex-col items-center">
                <div className="absolute mr-9 mt-1.5 flex h-12 w-12 items-center justify-center rounded-full bg-green-600/10 text-white shadow-custom-green">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 shadow-custom-green">
                    <span className="font-bold text-white">{item.icon}</span>
                  </div>
                </div>
                {index < Object.keys(tutorialData).length - 1 && (
                  <div className="my-2 h-full w-1 bg-gray-300" />
                )}
              </div>
              <div className="flex-1 animate-fade-right">
                <h2 className="mb-1 mt-4 animate-fade-right text-xl font-semibold animate-delay-100">
                  {key}. {item.description}
                </h2>
                <ul className="mt-4 list-disc pl-5">
                  {item.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="mb-2 text-gray-300">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <div className="flex w-full animate-fade-up gap-3 pt-12 animate-delay-[1300ms]">
          <button
            onClick={handleConnectWallet}
            className="flex w-fit items-center gap-2 text-nowrap border border-green-500 bg-green-600/5 px-4 py-2.5 font-semibold text-green-500 backdrop-blur-md transition duration-200 hover:border-green-400 hover:bg-green-500/15 active:bg-green-500/50"
          >
            <Wallet className="h-6 w-6" /> Open Wallet Modal
          </button>
          <Link
            href="/modules"
            className="flex w-fit items-center gap-2 text-nowrap border border-green-500 bg-green-600/5 px-4 py-2.5 font-semibold text-green-500 backdrop-blur-md transition duration-200 hover:border-green-400 hover:bg-green-500/15 active:bg-green-500/50"
          >
            <Grid2X2 className="h-6 w-6" /> Go to Modules
          </Link>
          <Link
            href="/subnets"
            className="flex w-fit items-center gap-2 text-nowrap border border-cyan-500 bg-cyan-600/5 px-4 py-2.5 font-semibold text-cyan-500 backdrop-blur-md transition duration-200 hover:border-cyan-400 hover:bg-cyan-500/15 active:bg-cyan-500/50"
          >
            <SquareStack className="h-6 w-6" /> Go to Subnets
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
