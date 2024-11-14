import Link from "next/link";
import { Eye, MessagesSquare } from "lucide-react";
import { DateTime } from "luxon";

import { smallAddress } from "@torus-ts/utils/subspace";

import { cairo } from "~/utils/fonts";
import { CategoriesTag } from "./categories-tag";
import { VotesDisplay } from "./votes-display";

function formatInteractionNumbers(num: number): string {
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (absNum < 1000) {
    return sign + absNum.toString();
  }

  const exp = Math.floor(Math.log10(absNum) / 3);
  const scale = Math.pow(10, exp * 3);
  const scaled = absNum / scale;

  let formatted: string;
  if (scaled < 10) {
    formatted = scaled.toFixed(1).replace(/\.0$/, "");
  } else {
    formatted = Math.floor(scaled).toString();
  }

  return sign + formatted + "KMB"[exp - 1];
}

interface PostItemProps {
  post:
    | {
        id: string;
        title: string;
        userKey: string;
        isAnonymous: boolean;
        categoryName: string | null;
        href: string | null;
        createdAt: Date;
        downvotes: number;
        upvotes: number;
        categoryId: number;
        isPinned: boolean;
        commentCount: number;
        viewCount: number | null;
      }
    | undefined;
}

export const PostItem: React.FC<PostItemProps> = (props) => {
  const { post } = props;

  if (!post) return null;
  const formattedDate = DateTime.fromJSDate(post.createdAt)
    .toLocal()
    .toRelative();

  return (
    <>
      <Link
        href={`/post/${post.id}`}
        key={post.id}
        className={`${cairo.className}`}
      >
        <div className="flex w-full flex-col items-start justify-between border border-white/20 bg-[#898989]/5 p-3 transition duration-200 hover:border-green-500 hover:bg-green-500/10 lg:flex-row lg:items-center">
          <div className="flex items-center justify-center divide-x divide-white/20">
            <div className="flex flex-col gap-1.5 lg:gap-0.5">
              <div className="flex min-w-0 flex-col items-start justify-start gap-1.5 lg:flex-row lg:items-center">
                <div className="flex flex-row-reverse items-center justify-between">
                  <CategoriesTag
                    categoryId={post.categoryId}
                    categoryName={post.categoryName ?? "Uncategorized"}
                    className="lg:hidden"
                  />
                  <span className="mr-2 text-sm text-gray-400">
                    #{post.id.slice(0, 4)}
                  </span>
                </div>
                <h4 className="line-clamp-3 text-ellipsis pr-4 text-base sm:line-clamp-2 md:line-clamp-1">
                  {post.title}
                </h4>
              </div>

              <div className="flex flex-col items-start pr-4 sm:flex-row sm:items-center sm:gap-1.5">
                <div className="flex items-center">
                  <span className="mr-1.5 text-sm text-green-500">By:</span>
                  <span className="text-sm text-gray-300">
                    {post.isAnonymous
                      ? "Anonymous"
                      : smallAddress(post.userKey)}
                  </span>
                </div>
                <span className="hidden text-gray-300 sm:block">-</span>
                <span className="text-sm text-gray-300">{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex w-full items-center justify-center gap-3 sm:min-w-fit lg:mt-0 lg:w-fit lg:flex-row lg:justify-end lg:pl-4">
            <div className="hidden items-center lg:flex">
              <CategoriesTag
                categoryId={post.categoryId}
                categoryName={post.categoryName ?? "Uncategorized"}
                className="hidden lg:block"
              />
            </div>
            <div className="flex w-full items-center justify-center gap-3 sm:justify-end lg:w-fit">
              <div className="flex w-1/3 items-center justify-center gap-2 space-x-0 divide-x divide-white/10 border border-white/10 px-3 py-2 text-center text-sm text-green-500 lg:w-auto">
                <MessagesSquare className="fill-green-500" height={16} />
                {!post.commentCount
                  ? formatInteractionNumbers(post.commentCount)
                  : 0}
              </div>
              <div className="flex w-1/3 items-center justify-center gap-2 space-x-0 divide-x divide-white/10 border border-white/10 px-3 py-2 text-center text-sm text-green-500">
                <Eye className="fill-green-500" height={16} />
                {post.viewCount ? formatInteractionNumbers(post.viewCount) : 0}
              </div>
              <VotesDisplay
                className="w-1/3"
                upVotes={
                  post.upvotes ? formatInteractionNumbers(post.upvotes) : 0
                }
                downVotes={
                  post.downvotes ? formatInteractionNumbers(post.downvotes) : 0
                }
              />
            </div>
          </div>
        </div>
      </Link>
    </>
  );
};
