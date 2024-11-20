"use client";

import Link from "next/link";
import { ChevronsLeft } from "lucide-react";

import { useTorus } from "@torus-ts/providers/use-torus";
import { Button } from "@torus-ts/ui";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";

interface ValidatorsListProps {
  listType: "all" | "staked";
  onSelectValidator: (validator: { address: string; stake?: string }) => void;
  onBack: () => void;
  userAddress: string;
}

interface Validator {
  name: string;
  description: string;
  address: string;
  stake?: bigint;
}

export function ValidatorsList(props: ValidatorsListProps) {
  const { userTotalStaked } = useTorus();

  const validatorsList = [
    {
      name: "torusx",
      description: "Validator of torusx platform.",
      address: "5DUWKpGBneBbna6PFHZk18Gp9wyvLUFPiWy5maAARjRjayPp",
    },
    {
      name: "Community Validator",
      description: "Community Validator official validator.",
      address: "5Hgik8Kf7nq5VBtW41psbpXu1kinXpqRs4AHotPe6u1w6QX2",
    },
    {
      name: "vali::comstats",
      description: "Validator of Comstats platform.",
      address: "5H9YPS9FJX6nbFXkm9zVhoySJBX9RRfWF36abisNz5Ps9YaX",
    },
    {
      name: "vali::SolBridge",
      description: "Validator of SolBridge platform.",
      address: "5EWrhYAvSLCFi6wYAJY1cFmBuziaqKc6RrBjhuRMLu1QtHzd",
    },
    {
      name: "market-compass::vali",
      description: "Validator of Market Compass platform.",
      address: "5HEUfzHf8uRUq1AfX2Wgga9xC2u12wfyF4FTKUMaYvDFH7dw",
    },
  ];

  function getValidatorsList(): Validator[] {
    if (props.listType === "staked" && userTotalStaked) {
      return userTotalStaked.map((item) => ({
        name: ``,
        description: `Staked amount: ${formatToken(Number(item.stake))}`,
        address: item.address,
        stake: item.stake,
      }));
    }
    return validatorsList;
  }

  const currentList = getValidatorsList();

  return (
    <div className="mt-4 w-full animate-fade-down border-t border-white/20 pt-2">
      <div className="mb-4 border-b border-white/20">
        <h3 className="font-bold text-gray-300">Select a Validator</h3>
        <p className="pb-2 text-sm text-gray-300">
          Once you select a validator, it will automatically fill the field with
          their address. View all validators list{" "}
          <Link
            href="https://www.comstats.org/"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            here
          </Link>
          .
        </p>
      </div>
      <div className="flex animate-fade-down flex-col gap-y-4 animate-delay-200">
        {currentList.map((item) => (
          <Button
            key={item.address}
            onClick={() => props.onSelectValidator({ address: item.address })}
            variant="outline"
          >
            <div className="flex w-full flex-col items-start gap-1">
              <div className="flex w-full flex-row items-start justify-between md:flex-row">
                <span className="flex gap-1">
                  {item.name !== "" && (
                    <p className="text-white">
                      {item.name.toLocaleUpperCase()} /
                    </p>
                  )}
                  <p>{item.description}</p>
                </span>
                <span className="text-gray-300">
                  {smallAddress(item.address)}
                </span>
              </div>
            </div>
          </Button>
        ))}
        <Button onClick={props.onBack}>
          <ChevronsLeft className="h-6 w-6" /> Back to Field Options
        </Button>
      </div>
    </div>
  );
}
