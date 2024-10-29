"use client";

import { useMemo, useCallback } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import React from "react";
import { Check, ChevronsUp, X } from "lucide-react";

export interface Category {
  id: number | null;
  name: string;
}

interface CategoriesSelectorProps {
  categories: Category[];
  selectedCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
  defaultCategoryName?: string;
}

const BUTTON_BASE_CLASSES =
  "relative w-full cursor-default bg-white/5 text-center sm:text-left py-1 pl-3 pr-3 sm:pr-10 text-left border sm:text-sm sm:leading-6 hover:border-green-500 hover:cursor-pointer hover:text-green-500";
const OPTIONS_CLASSES =
  "absolute z-10 mt-1 max-h-60 w-full overflow-auto bg-white/5 backdrop-blur-md p-0.5 border border-white/20 text-base shadow-lg data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm";
const OPTION_CLASSES =
  "group relative cursor-default select-none py-2 pl-3 pr-9 text-white hover:cursor-pointer data-[focus]:bg-white/5 data-[focus]:text-green-500";

export const CategoriesSelector: React.FC<CategoriesSelectorProps> = React.memo(
  ({ categories, selectedCategory, onCategoryChange, defaultCategoryName }) => {

    const overrideCategories = useMemo(() => {
      return [{ id: null, name: defaultCategoryName ?? "ALL" }, ...categories];
    }, [categories, defaultCategoryName]);

    const buttonClasses = useMemo(
      () =>
        [
          BUTTON_BASE_CLASSES,
          selectedCategory ? "border-green-500 text-green-500" : "border-white/20",
        ].join(" "),
      [selectedCategory]
    );

    const handleClearSelection = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onCategoryChange(null);
      },
      [onCategoryChange]
    );

    return (
      <Listbox value={selectedCategory} onChange={onCategoryChange}>
        <div className="relative w-full sm:w-fit min-w-[140px] m-0">
          <ListboxButton className={buttonClasses}>
            <span className="block truncate">
              {selectedCategory?.name ?? overrideCategories[0]?.name}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              {selectedCategory ? (
                <X
                  className="w-5 h-5 text-gray-400 cursor-pointer pointer-events-auto"
                  onClick={handleClearSelection}
                />
              ) : (
                <ChevronsUp
                  aria-hidden="true"
                  className="w-5 h-5 text-gray-400"
                />
              )}
            </span>
          </ListboxButton>

          <ListboxOptions className={OPTIONS_CLASSES}>
            {overrideCategories.map((category) => (
              <ListboxOption
                key={category.id ?? "default"}
                value={category.id === null ? null : category}
                className={OPTION_CLASSES}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate ${selected ? "font-semibold" : "font-normal"
                        }`}
                    >
                      {category.name}
                    </span>
                    {selected && category.id !== null && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-green-500">
                        <Check
                          aria-hidden="true"
                          className="w-5 h-5"
                        />
                      </span>
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    );
  }
);
