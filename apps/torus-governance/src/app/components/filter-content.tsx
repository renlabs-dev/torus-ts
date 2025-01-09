"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input } from "@torus-ts/ui";

export const Filter = () => {
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (!search) {
      params.delete("search");
      return router.push(`/?${params.toString()}`);
    }

    const query = createQueryString("search", search);

    router.push(`/?${query}`);
  };

  return (
    <div className="flex w-full items-center justify-center rounded-md pl-3 md:w-1/2 xl:w-1/3 bg-accent/40">
      <SearchIcon size={16} />
      <Input
        onChange={handleSearchChange}
        placeholder="Search"
        className="border-none focus-visible:ring-0"
      />
    </div>
  );
};

export const FilterContent = () => {
  return (
    <Suspense>
      <Filter />
    </Suspense>
  );
};
