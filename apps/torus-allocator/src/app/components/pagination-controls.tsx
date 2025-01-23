"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationControlsProps {
  totalPages: number;
}

export function PaginationControls({ totalPages }: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const handlePageChange = (newPage: number) => {
    router.push(`?page=${newPage}`);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  return (
    <div className="mt-4 flex w-full items-center justify-start gap-3 pb-6">
      <button
        onClick={handlePrevPage}
        disabled={currentPage === 1}
        className={`border border-white/20 bg-[#898989]/5 px-4 py-2 text-white ${currentPage !== 1 && `hover:border-green-500 hover:bg-green-500/10`} disabled:opacity-50`}
      >
        Previous
      </button>
      <button
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        className={`border border-white/20 bg-[#898989]/5 px-4 py-2 text-white ${currentPage !== totalPages && `hover:border-green-500 hover:bg-green-500/10`} disabled:opacity-50`}
      >
        Next
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}
