"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onSearchChange: (searchTerm: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  placeholder = "Search...",
  value: externalValue = "",
  onSearchChange,
  debounceMs = 500,
  className = "",
}: SearchInputProps) {
  const [searchInput, setSearchInput] = useState(externalValue);
  const [debouncedSearch, setDebouncedSearch] = useState(externalValue);

  // Sync with external value changes
  useEffect(() => {
    setSearchInput(externalValue);
    setDebouncedSearch(externalValue);
  }, [externalValue]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchInput, debounceMs]);

  // Notify parent when debounced search changes
  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  // Handle blur event to trigger immediate search
  const handleSearchBlur = useCallback(() => {
    if (searchInput !== debouncedSearch) {
      setDebouncedSearch(searchInput);
    }
  }, [searchInput, debouncedSearch]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onBlur={handleSearchBlur}
        className="pl-9 w-full"
      />
    </div>
  );
}
