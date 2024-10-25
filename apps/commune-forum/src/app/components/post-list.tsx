"use client";

import { useMemo } from "react";
import { api } from "~/trpc/react";
import { useRouter, useSearchParams } from "next/navigation";
import { cairo } from "~/utils/fonts";
import { PostItem } from "./post-item-list";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext } from "@commune-ts/ui";

const sorters = {
  createdAt: "createdAt",
  upvotes: "upvotes",
} as const;

type SortBy = keyof typeof sorters;

export const PostList: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sortOrder = useMemo(() => {
    const order = searchParams.get("order")?.toUpperCase();
    return order === "ASC" || order === "DESC" ? order : "DESC";
  }, [searchParams]);

  const sortBy = useMemo<SortBy>(() => {
    const sortByParam = searchParams.get("sortBy");
    return sortByParam && sortByParam in sorters
      ? (sortByParam as SortBy)
      : "createdAt";
  }, [searchParams]);

  const currentPage = useMemo(() => {
    const page = searchParams.get("page");
    return page ? Number(page) : 1;
  }, [searchParams]);

  const categoryId = useMemo(() => {
    const id = searchParams.get("categoryId");
    return id ? Number(id) : null;
  }, [searchParams]);

  const { data: posts, isFetching } = api.forum.all.useQuery(
    {
      sortOrder,
      sortBy,
      categoryId: categoryId,
      page: currentPage,
      pageSize: 5,
    },
  );

  const unpinnedPosts = posts?.posts.filter((post) => !post.isPinned) ?? [];
  const pinnedPosts = posts?.posts.filter((post) => post.isPinned) ?? [];

  const hasDivider = (pinnedPosts.length > 0) && (unpinnedPosts.length > 0);

  const totalPages = posts?.totalPages ?? 0;

  const pageNumbers = useMemo(() => {
    const numbers = [];
    const range = 2;

    for (let i = currentPage - range; i <= currentPage + range; i++) {
      if (i > 0 && i <= totalPages) {
        numbers.push(i);
      }
    }

    return numbers;
  }, [currentPage, totalPages]);

  const renderPinnedPosts = () => {
    if (pinnedPosts.length === 0) return null;
    return (
      <div className="flex flex-col gap-2">
        <span className="text-base">Pinned posts</span>
        {pinnedPosts.map((post) => {
          return (
            <PostItem post={post} key={post.id} />
          )
        })}
      </div>)
  }

  const renderUnpinnedPosts = () => {
    if (unpinnedPosts.length === 0) return null;
    return (
      <div className="flex flex-col gap-2">
        {unpinnedPosts.map((post) => {
          return (
            <PostItem post={post} key={post.id} />
          )
        })}
      </div>)
  }

  return (
    <div className={`flex flex-col w-full pt-8 pb-8 gap-2 ${cairo.className} h-auto`}>
      {renderPinnedPosts()}
      {hasDivider && <span className="w-full flex h-[1px] bg-white/10 my-6"></span>}
      {renderUnpinnedPosts()}

      {isFetching && (
        <div className="flex flex-col items-center justify-center w-full gap-4 pt-10 pb-10 my-auto transition animate-fade">
          <p className="text-lg">Loading...</p>
        </div>
      )}

      {!posts || (unpinnedPosts.length === 0 && pinnedPosts.length === 0) && (
        <div className="flex flex-col items-center justify-center w-full gap-4 pt-10 pb-10 my-auto transition animate-fade">
          <p className="text-lg">No post found.</p>
        </div>
      )}

      <div className="flex justify-center mt-auto">
        <Pagination>
          <PaginationContent>
            {/* Previous Button */}
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => router.push(`?page=${currentPage - 1}`)}
                  aria-label="Previous page"
                />
              </PaginationItem>
            )}

            {/* First Page */}
            {currentPage > 3 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => router.push(`?page=1`)}
                    aria-label="Go to page 1"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {/* Ellipsis */}
                {currentPage > 4 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}

            {/* Page Numbers */}
            {pageNumbers.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                {pageNumber === currentPage ? (
                  <PaginationLink isActive aria-current="page">
                    {pageNumber}
                  </PaginationLink>
                ) : (
                  <PaginationLink
                    onClick={() => router.push(`?page=${pageNumber}`)}
                    aria-label={`Go to page ${pageNumber}`}
                  >
                    {pageNumber}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            {/* Last Page */}
            {currentPage < totalPages - 2 && (
              <>
                {/* Ellipsis */}
                {currentPage < totalPages - 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => router.push(`?page=${totalPages}`)}
                    aria-label={`Go to page ${totalPages}`}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            {/* Next Button */}
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext
                  onClick={() => router.push(`?page=${currentPage + 1}`)}
                  aria-label="Next page"
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>

    </div >
  );
};
