"use client";

import { useState } from "react";
import { ChevronsDown, ChevronsUp, UserCircle } from "lucide-react";
import { DateTime } from "luxon";

import { smallAddress } from "@torus-ts/utils/subspace";

import { api } from "~/trpc/react";
import { ReportComment } from "./report-comment";

export enum VoteType {
  UP = "UP",
  DOWN = "DOWN",
}

export function ViewComment({ postId }: { postId: string }) {
  const { data: postComments, isLoading } =
    api.forum.getCommentsByPost.useQuery({ postId }, { enabled: !!postId });

  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "mostUpvotes">(
    "oldest",
  );

  const sortedComments = postComments
    ? [...postComments].sort((a, b) => {
        if (sortBy === "newest") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
      })
    : [];

  return (
    <div className="flex w-full flex-col">
      <div className="m-2 flex h-full min-h-max animate-fade-down flex-col items-center justify-between border border-white/20 bg-[#898989]/5 p-6 text-white backdrop-blur-md animate-delay-200">
        <div className="mb-4 flex w-full flex-col items-center justify-between gap-1 border-b border-gray-500 border-white/20 pb-2 text-gray-400 md:flex-row">
          <h2 className="w-full text-start font-semibold">
            Community Comments
          </h2>
          <div className="flex w-full space-x-2 md:justify-end">
            {["oldest", "newest"].map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option as typeof sortBy)}
                className={`px-3 py-1 text-sm ${
                  sortBy === option
                    ? "border border-green-500 bg-green-500/20 text-white"
                    : "border border-white/20 bg-[#898989]/5 text-gray-300 hover:bg-gray-600/50"
                }`}
              >
                {option === "newest"
                  ? "Newest"
                  : option === "oldest"
                    ? "Oldest"
                    : "Most Upvotes"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="flex w-full animate-pulse flex-col gap-2 border border-white/20 bg-[#898989]/5 p-2">
              <div className="flex justify-between border-b border-white/20 px-2 py-1 pb-2">
                <span className="flex items-center gap-1">
                  <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm">
                    <UserCircle className="h-4 w-4" />
                  </span>{" "}
                  Loading user address...
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={true}
                    className={`flex items-center text-gray-300`}
                  >
                    <ChevronsUp className="h-5 w-5" />
                    <span>-</span>
                  </button>
                  <button
                    disabled={true}
                    className={`flex items-center text-gray-300`}
                  >
                    <ChevronsDown className="h-5 w-5" />
                    <span>-</span>
                  </button>
                </div>
              </div>
              <p className="p-2">Loading...</p>
            </div>
          </>
        ) : (
          <>
            {sortedComments.length ? (
              <div
                className={`flex max-h-[25vh] w-full flex-col gap-3 overflow-auto pb-3 ${sortedComments.length >= 3 && "pr-2"}`}
              >
                {sortedComments.map((comment) => {
                  return (
                    <div
                      key={comment.id}
                      className="relative flex w-full flex-col gap-2 border border-white/20 bg-[#898989]/5 p-2 pb-4"
                    >
                      <div className="flex justify-between border-b border-white/20 px-2 py-1 pb-2">
                        <div className="flex items-center gap-2">
                          By: {smallAddress(comment.userKey)}{" "}
                          <span className="text-sm text-gray-300">
                            {DateTime.fromJSDate(comment.createdAt)
                              .toLocal()
                              .toRelative()}
                          </span>
                        </div>
                      </div>
                      <p className="p-2">{comment.content}</p>
                      <div className="absolute bottom-2 right-2">
                        <ReportComment commentId={comment.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No comments yet</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
