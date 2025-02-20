"use client";

import { Tabs, TabsList, TabsTrigger } from "@torus-ts/ui/components/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

export const AgentsTabViewContent = () => {
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

  const handleSearchChange = (tab: "all" | "weighted" | "popular") => {
    const params = new URLSearchParams(searchParams.toString());

    if (tab === "all") {
      params.delete("view-type");
      return router.push(`/?${params.toString()}`);
    }

    const query = createQueryString("view-type", tab);

    router.push(`/?${query}`);
  };

  return (
    <Tabs
      defaultValue="all"
      value={viewType ?? "all"}
      className="w-full min-w-fit md:w-fit"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger onClick={() => handleSearchChange("all")} value="all">
          All
        </TabsTrigger>
        <TabsTrigger
          onClick={() => handleSearchChange("weighted")}
          value="weighted"
        >
          Weighted
        </TabsTrigger>
        <TabsTrigger
          onClick={() => handleSearchChange("popular")}
          value="popular"
        >
          Popular
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export const AgentsTabView = () => {
  return (
    <Suspense>
      <AgentsTabViewContent />
    </Suspense>
  );
};
