import { Suspense } from "react";

import type { Module } from "~/utils/types";
import { ModuleCard } from "~/app/components/module-card";
import { PaginationControls } from "~/app/components/pagination-controls";
import { ViewControls } from "~/app/components/view-controls";
import { api } from "~/trpc/server";
import { z } from "zod";

const SORT_KEYS_SCHEMA = z.enum([
  "id",
  "emission",
  "incentive",
  "dividend",
  "delegationFee",
  "totalStakers",
  "totalStaked",
  "totalRewards",
  "createdAt",
]);

export default async function ModulesPage({
  searchParams,
}: {
  searchParams: { page?: string; sortBy?: string; order?: string };
}) {
  const currentPage = Number(searchParams.page) || 1;
  const sortBy = searchParams.sortBy ?? "id";
  const order = searchParams.order === "desc" ? "desc" : "asc";

  const sortBy_ = SORT_KEYS_SCHEMA.parse(sortBy);

  const { modules, metadata } = await api.module.paginatedAll({
    page: currentPage,
    limit: 24,
    sortBy: sortBy_,
    order: order,
  });

  return (
    <div className="min-h-[calc(100vh-169px)] w-full">
      <Suspense fallback={<div>Loading view controls...</div>}>
        <ViewControls />
      </Suspense>
      <div className="mb-16 grid w-full animate-fade-up grid-cols-1 gap-4 backdrop-blur-md animate-delay-700 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modules.length ? (
          modules.map((module: Module) => (
            <ModuleCard
              id={module.id}
              key={module.id}
              name={module.name ?? ""}
              moduleKey={module.moduleKey}
            />
          ))
        ) : (
          <p>No modules found</p>
        )}
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <PaginationControls totalPages={metadata.totalPages} />
      </Suspense>
    </div>
  );
}
