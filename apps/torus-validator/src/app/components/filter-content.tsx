"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input, Label } from "@torus-ts/ui";

interface FilterProps {
  disabled: boolean;
}

export const Filter = (props: FilterProps) => {
  const { disabled } = props;
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
    <Label
      htmlFor="search-bar"
      className="rounded-radius flex w-full items-center justify-center border pl-3 lg:w-1/2 xl:w-1/3"
    >
      <SearchIcon size={16} />
      <Input
        id="search-bar"
        disabled={disabled}
        onChange={handleSearchChange}
        placeholder="Search"
        className="border-none focus-visible:ring-0"
      />
    </Label>
  );
};

export const FilterContent = (props: FilterProps) => {
  return (
    <Suspense>
      <Filter disabled={props.disabled} />
    </Suspense>
  );
};
