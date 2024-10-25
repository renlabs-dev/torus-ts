import { Suspense } from "react";
import { z } from "zod";

import type { Subnet } from "~/utils/types";
import { PaginationControls } from "~/app/components/pagination-controls";
import SubnetCard from "~/app/components/subnet-card";
import { SubnetViewControls } from "~/app/components/subnet-view-controls";
import { api } from "~/trpc/server";

const SORT_KEYS_SCHEMA = z.enum([
  "id",
  "founderShare",
  "incentiveRatio",
  "proposalRewardTreasuryAllocation",
  "minValidatorStake",
  "createdAt",
]);

export default async function SubnetsPage({
  searchParams,
}: {
  searchParams: { page?: string; sortBy?: string; order?: string };
}) {
  const currentPage = Number(searchParams.page) || 1;
  const sortBy = searchParams.sortBy ?? "id";
  const order = searchParams.order === "desc" ? "desc" : "asc";

  const sortBy_ = SORT_KEYS_SCHEMA.parse(sortBy);

  const { subnets, metadata } = await api.subnet.paginatedAll({
    page: currentPage,
    limit: 24,
    sortBy: sortBy_,
    order: order,
  });

  return (
    <>
      <Suspense fallback={<div>Loading view controls...</div>}>
        <SubnetViewControls />
      </Suspense>
      <div className="mb-4 flex w-full flex-col gap-4">
        {subnets.length ? (
          subnets.map((subnet: Subnet) => (
            <SubnetCard
              key={subnet.id}
              founderAddress={subnet.founder}
              id={subnet.netuid}
              name={subnet.name}
            />
          ))
        ) : (
          <p>No subnets found</p>
        )}
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <PaginationControls totalPages={metadata.totalPages} />
      </Suspense>
    </>
  );
}
