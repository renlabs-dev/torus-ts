"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@torus-ts/ui/components/pagination";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

interface PaginationNavProps {
  currentPage: number;
  totalPages: number;
}

export function PaginationNav({
  currentPage,
  totalPages,
}: PaginationNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const maxVisiblePages = 3;
  const halfVisible = Math.floor(maxVisiblePages / 2);

  let startPage = Math.max(currentPage - halfVisible, 1);
  const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(endPage - maxVisiblePages + 1, 1);
  }

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    return `?${params.toString()}`;
  };

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    router.push(getPageUrl(page));
  };

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <PaginationItem key={i}>
        <PaginationLink
          href={getPageUrl(i)}
          isActive={currentPage === i}
          onClick={(e) => handlePageChange(i, e)}
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
              onClick={(e) => handlePageChange(currentPage - 1, e)}
            />
          </PaginationItem>
        )}

        {startPage > 1 && (
          <>
            <PaginationItem>
              <PaginationLink
                href={getPageUrl(1)}
                onClick={(e) => handlePageChange(1, e)}
              >
                1
              </PaginationLink>
            </PaginationItem>
            {startPage > 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
          </>
        )}

        {pages}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink
                href={getPageUrl(totalPages)}
                onClick={(e) => handlePageChange(totalPages, e)}
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
              onClick={(e) => handlePageChange(currentPage + 1, e)}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
