"use client";

import { useCommune } from "@commune-ts/providers/use-commune";

import SubnetCard from "~/app/components/subnet-card";
import { useDelegateSubnetStore } from "~/stores/delegateSubnetStore";

export default function Page() {
  const { selectedAccount } = useCommune();
  const { delegatedSubnets } = useDelegateSubnetStore();

  if (!selectedAccount?.address)
    return (
      <span className="w-full items-center justify-start pt-12 text-center text-lg">
        Connect Wallet to view your weighted subnets.
      </span>
    );

  const weightedSubnets = delegatedSubnets.filter(
    (subnet) => subnet.percentage > 0,
  );

  return (
    <div className="min-h-[calc(100vh-169px)] w-full">
      {weightedSubnets.length ? (
        <div className="mb-16 flex h-full w-full grid-cols-1 flex-col gap-4 backdrop-blur-md animate-delay-700">
          {weightedSubnets.map((subnet) => (
            <SubnetCard
              id={subnet.id}
              key={subnet.id}
              name={subnet.name}
              percentage={subnet.percentage}
              founderAddress={subnet.founderAddress}
            />
          ))}
        </div>
      ) : (
        <span className="w-full items-center justify-start pt-12 text-center text-lg">
          <p>No weighted subnets found.</p>
        </span>
      )}
    </div>
  );
}
