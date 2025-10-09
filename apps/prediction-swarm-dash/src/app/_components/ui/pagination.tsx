"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = "",
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      <div className="text-muted-foreground text-xs sm:text-sm order-2 sm:order-1">
        Showing {startItem}-{endItem} of {totalItems} items
      </div>

      <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="hover:bg-muted/50 px-2 sm:px-3"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Show page numbers */}
          {totalPages <= 5 ? (
            // Show all pages if 5 or fewer
            Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={`min-w-[2rem] sm:min-w-[2.5rem] h-8 px-1 sm:px-2 text-xs sm:text-sm ${
                  page === currentPage
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/50"
                }`}
              >
                {page}
              </Button>
            ))
          ) : (
            // Show condensed pagination for many pages
            <>
              {currentPage > 2 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(1)}
                    className="min-w-[2rem] sm:min-w-[2.5rem] h-8 px-1 sm:px-2 text-xs sm:text-sm hover:bg-muted/50"
                  >
                    1
                  </Button>
                  {currentPage > 3 && (
                    <span className="text-muted-foreground px-1 text-xs">
                      ...
                    </span>
                  )}
                </>
              )}

              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const page =
                  Math.max(1, Math.min(totalPages - 2, currentPage - 1)) + i;
                return page;
              }).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={`min-w-[2rem] sm:min-w-[2.5rem] h-8 px-1 sm:px-2 text-xs sm:text-sm ${
                    page === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {page}
                </Button>
              ))}

              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && (
                    <span className="text-muted-foreground px-1 text-xs">
                      ...
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    className="min-w-[2rem] sm:min-w-[2.5rem] h-8 px-1 sm:px-2 text-xs sm:text-sm hover:bg-muted/50"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="hover:bg-muted/50 px-2 sm:px-3"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
