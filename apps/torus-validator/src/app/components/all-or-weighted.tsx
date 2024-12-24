"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@torus-ts/ui";

export const AllOrWeighted = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const viewType = new URLSearchParams(searchParams.toString()).get(
    "view-type",
  );

  const handleSearchChange = (tab: "all" | "weighted") => {
    const params = new URLSearchParams(searchParams.toString());

    if (tab === "all") {
      params.delete("view-type");
      return router.push(`/?${params.toString()}`);
    }

    const query = createQueryString("view-type", tab);

    router.push(`/?${query}`);
  };

  return (
    <Tabs defaultValue="all" value={viewType ?? "all"} className="w-[200px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger onClick={() => handleSearchChange("all")} value="all">
          All
        </TabsTrigger>
        <TabsTrigger
          onClick={() => handleSearchChange("weighted")}
          value="weighted"
        >
          Weighted
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export const AllOrWeightedTabs = () => {
  return (
    <Suspense>
      <AllOrWeighted />
    </Suspense>
  );
};
