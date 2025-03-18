"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@torus-ts/ui/components/pagination";
import { useRouter } from "next/navigation";
import React from "react";

interface CustomPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  search: string | null | undefined;
  viewType: string | null;
  onPageChange: (page: number) => void;
}

export const CustomPagination: React.FC<CustomPaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  search,
  viewType,
  onPageChange,
}) => {
  const router = useRouter();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null; // Don't show pagination if only one page

  const maxVisiblePages = 3;
  const halfVisible = Math.floor(maxVisiblePages / 2);

  let startPage = Math.max(currentPage - halfVisible, 1);
  const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(endPage - maxVisiblePages + 1, 1);
  }

  const getPageUrl = (page: number) => {
    let url = "?page=" + page;
    if (search) url += "&search=" + search;
    if (viewType) url += "&view-type=" + viewType;
    return url;
  };

  const handlePageClick = (page: number) => (e: React.MouseEvent) => {
    e.preventDefault();

    // If we're in server-side rendering mode (onPageChange is a noop function)
    if (onPageChange.toString() === "() => {}") {
      router.push(getPageUrl(page));
    } else {
      // For client-side pagination
      onPageChange(page);
    }
  };

  const pages = [];

  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <PaginationItem key={i}>
        <PaginationLink
          href={getPageUrl(i)}
          isActive={currentPage === i}
          onClick={handlePageClick(i)}
        >
          {i}
        </PaginationLink>
      </PaginationItem>,
    );
  }

  return (
    <Pagination className="my-10">
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious
              href={getPageUrl(currentPage - 1)}
              onClick={handlePageClick(currentPage - 1)}
            />
          </PaginationItem>
        )}

        {startPage > 1 && (
          <>
            <PaginationItem>
              <PaginationLink href={getPageUrl(1)} onClick={handlePageClick(1)}>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </>
        )}

        {pages}

        {endPage < totalPages && (
          <>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                href={getPageUrl(totalPages)}
                onClick={handlePageClick(totalPages)}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext
              href={getPageUrl(currentPage + 1)}
              onClick={handlePageClick(currentPage + 1)}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
};
