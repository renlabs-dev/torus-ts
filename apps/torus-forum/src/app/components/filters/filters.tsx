"use client"

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLongDownIcon } from "@heroicons/react/16/solid";
import type { Category } from "./categories-selector";
import { CategoriesSelector } from "./categories-selector";
import { cairo } from "~/utils/fonts";

type SortField = "createdAt" | "upvotes";
type SortOrder = "asc" | "desc";
interface RenderSortersProps {
  sortFieldLabels: Record<SortField, string>;
  handleSortChange: (field: SortField) => void;
  sortField: SortField;
  orderStyles: Record<SortOrder, string>;
  sortOrder: SortOrder;
}

const sortFieldLabels: Record<SortField, string> = {
  createdAt: "Date",
  upvotes: "Upvotes",
};

const orderStyles: Record<SortOrder, string> = {
  asc: "-rotate-180",
  desc: "rotate-0"
};

const RenderSorters: React.FC<RenderSortersProps> = React.memo(({ sortFieldLabels, handleSortChange, sortField, orderStyles, sortOrder }) => {
  return (
    <>
      {Object.entries(sortFieldLabels).map(([field, label]) => (
        <button
          key={field}
          onClick={() => handleSortChange(field as SortField)}
          className={`flex animate-fade justify-center items-center gap-1 px-4 pl-8 py-1.5 text-sm font-semibold border w-full
        ${sortField === field ? 'border-green-500 bg-green-500/10 text-green-500' : 'bg-white/5  border-white/20 hover:border-green-500 hover:text-green-500'}`}
        >
          {label}
          <ArrowLongDownIcon
            height={16}
            className={`transition duration-200 animate-delay-700 text-green-500
          ${sortField === field ? orderStyles[sortOrder] : 'invisible'}`}
          />
        </button>
      ))}
    </>
  )
});

interface FiltersProps {
  categories: Category[];
}

export const Filters: React.FC<FiltersProps> = ({ categories }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [sortField, setSortField] = useState<SortField>(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (searchParams.get("sortBy") as SortField) || "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (searchParams.get("order") as SortOrder) || "desc"
  );

  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("sortBy", sortField);
    newSearchParams.set("order", sortOrder);
    if (selectedCategory?.id) {
      newSearchParams.set("categoryId", String(selectedCategory.id));
    } else {
      newSearchParams.delete("categoryId");
    }
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  }, [sortField, sortOrder, selectedCategory?.id, router, searchParams]);

  const handleSortChange = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortOrder(prevOrder => (prevOrder === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  }, [sortField]);

  const handleCategoryChange = useCallback(
    (category: Category | null) => {
      if (category?.id === selectedCategory?.id) return
      setSelectedCategory(category);
    },
    [selectedCategory?.id]
  );

  return (
    <div className={`flex items-center flex-col sm:flex-row gap-4 w-full sm:w-fit ${cairo.className}`}>
      <CategoriesSelector
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />
      <RenderSorters
        sortFieldLabels={sortFieldLabels}
        handleSortChange={handleSortChange}
        sortField={sortField}
        orderStyles={orderStyles}
        sortOrder={sortOrder}
      />
    </div>
  );
};
