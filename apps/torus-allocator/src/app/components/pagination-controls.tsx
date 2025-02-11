// File: components/CustomPagination.tsx

import {
  PaginationItem,
  PaginationLink,
  Pagination,
  PaginationContent,
  PaginationPrevious,
  PaginationEllipsis,
  PaginationNext,
} from "@torus-ts/ui";
import React from "react";

interface CustomPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  search: string | null;
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
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null; // Don't show pagination if only one page

  const maxVisiblePages = 3;
  const halfVisible = Math.floor(maxVisiblePages / 2);

  let startPage = Math.max(currentPage - halfVisible, 1);
  const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(endPage - maxVisiblePages + 1, 1);
  }

  const getPageUrl = (page: number) =>
    `?page=${page}${search ? `&search=${search}` : ""}${viewType ? `&view-type=${viewType}` : ""}`;

  const handlePageClick = (page: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    onPageChange(page);
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
        <PaginationItem>
          <PaginationPrevious
            href={getPageUrl(currentPage - 1)}
            onClick={handlePageClick(currentPage - 1)}
          />
        </PaginationItem>

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

        <PaginationItem>
          <PaginationNext
            href={getPageUrl(currentPage + 1)}
            onClick={handlePageClick(currentPage + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
