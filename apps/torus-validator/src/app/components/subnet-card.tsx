"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { smallAddress } from "@torus-ts/utils/subspace";

import { useDelegateSubnetStore } from "~/stores/delegateSubnetStore";
import { DelegateSubnetWeight } from "./delegate-subnet-weight";

interface SubnetCardWeightProps {
  id: number; // TODO: rename to `netuid`
  name: string;
  founderAddress: string;
  percentage?: number;
}

export default function SubnetCard({
  id,
  name,
  founderAddress,
  percentage,
}: SubnetCardWeightProps) {
  const { delegatedSubnets } = useDelegateSubnetStore();
  const isSubnetDelegated = delegatedSubnets.some((s) => s.id === id);

  return (
    <div
      className={`duration-20 animate-fade-up gap-2 border py-4 text-lg text-white backdrop-blur-md transition ${isSubnetDelegated ? "border-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10" : "border-white/20 bg-[#898989]/5 hover:bg-white/5"}`}
    >
      <div className="flex flex-col items-center justify-between gap-3 border-white/20 px-4 md:flex-row">
        <div className="flex w-full flex-col md:flex-row md:gap-6">
          <NameCard label="Name" name={name} />
          <NameCard label="NETUID" name={`${id}`} />
          <NameCard label="Founder" name={smallAddress(founderAddress)} />
          {percentage && <NameCard label="Allocated" name={`${percentage}%`} />}
        </div>
        <div className="flex w-full justify-end gap-3">
          <DelegateSubnetWeight
            id={id}
            name={name}
            founderAddress={founderAddress}
          />
          <Link
            className="flex w-full items-center justify-between gap-2 border border-white/20 bg-[#898989]/5 p-2 pl-3 text-sm text-white backdrop-blur-md transition duration-200 hover:border-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-500 md:w-fit"
            href={`subnet/${id}`}
          >
            View More <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function NameCard({ name, label }: { name: string; label: string }) {
  return (
    <span className="flex gap-2">
      <p className="text-sm text-gray-400">
        <b className="text-lg text-gray-200">{name}</b> / {label}
      </p>
    </span>
  );
}
