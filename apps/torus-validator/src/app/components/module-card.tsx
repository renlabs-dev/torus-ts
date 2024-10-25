"use client";

import Link from "next/link";
import { ArrowRightIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

import { Label } from "@torus-ts/ui";
import { smallAddress } from "@torus-ts/utils";

import { useDelegateModuleStore } from "~/stores/delegateModuleStore";
import { CopySquareButton } from "./copy-square-button";
import { DelegateModuleWeight } from "./delegate-module-weight";

interface ModuleCardProps {
  id: number;
  name: string;
  percentage?: number;
  moduleKey: string; // SS58.1
}

export function ModuleCard(props: ModuleCardProps) {
  const { delegatedModules } = useDelegateModuleStore();
  const isModuleDelegated = delegatedModules.some((m) => m.id === props.id);

  return (
    <div
      className={`flex min-w-full flex-col gap-2 border p-6 text-gray-400 ${isModuleDelegated ? "border-green-500/80 bg-green-500/10" : "border-white/20 bg-[#898989]/5"}`}
    >
      <div className="flex w-full items-center justify-between">
        <h2
          className={`text-xl font-semibold ${isModuleDelegated ? "text-green-500" : "text-white"}`}
        >
          {props.name}
        </h2>
        {props.percentage && (
          <Label className="text-sm font-semibold text-white">
            {props.percentage}%
          </Label>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex w-full items-center gap-1 border border-white/20 bg-[#898989]/5 py-2 pl-2 backdrop-blur-md md:text-sm 2xl:text-base">
          <Squares2X2Icon className="h-6 w-6 text-green-500" />{" "}
          {smallAddress(String(props.moduleKey))}
        </span>
        <CopySquareButton address={props.moduleKey} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <DelegateModuleWeight
          id={props.id}
          name={props.name}
          moduleKey={props.moduleKey}
        />
        <Link
          className="flex w-full items-center justify-between border border-white/20 bg-[#898989]/5 p-2 pl-3 text-white backdrop-blur-md transition duration-200 hover:border-green-500 hover:bg-green-500/10"
          href={`module/${props.moduleKey}`}
        >
          View More <ArrowRightIcon className="h-5 w-5 text-green-500" />
        </Link>
      </div>
    </div>
  );
}
