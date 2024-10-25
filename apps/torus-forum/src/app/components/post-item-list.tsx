import Link from "next/link";
import { VotesDisplay } from "./votes-display";
import { ChatBubbleLeftRightIcon, EyeIcon } from "@heroicons/react/16/solid";
import { smallAddress } from "@torus-ts/utils";
import { cairo } from "~/utils/fonts";
import { DateTime } from "luxon";
import { CategoriesTag } from "./categories-tag";

function formatInteractionNumbers(num: number): string {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum < 1000) {
    return sign + absNum.toString();
  }

  const exp = Math.floor(Math.log10(absNum) / 3);
  const scale = Math.pow(10, exp * 3);
  const scaled = absNum / scale;

  let formatted: string;
  if (scaled < 10) {
    formatted = scaled.toFixed(1).replace(/\.0$/, '');
  } else {
    formatted = Math.floor(scaled).toString();
  }

  return sign + formatted + 'KMB'[exp - 1];
}

interface PostItemProps {
  post: {
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
  } | undefined
}

export const PostItem: React.FC<PostItemProps> = (props) => {
  const { post } = props

  if (!post) return null
  const formattedDate = DateTime.fromJSDate(post.createdAt).toLocal().toRelative()

  return (
    <>
      <Link
        href={`/post/${post.id}`}
        key={post.id}
        className={`${cairo.className}`}
      >

        <div className="flex justify-between w-full p-3 border border-white/20 bg-[#898989]/5 hover:border-green-500  hover:bg-green-500/10 transition duration-200 flex-col items-start lg:items-center lg:flex-row">
          <div className="flex items-center justify-center divide-x divide-white/20">
            <div className="flex flex-col gap-1.5 lg:gap-0.5">

              <div className="flex items-start lg:items-center min-w-0 justify-start flex-col lg:flex-row gap-1.5" >
                <div className="flex flex-row-reverse items-center justify-between">
                  <CategoriesTag categoryId={post.categoryId} categoryName={post.categoryName ?? "Uncategorized"} className="lg:hidden" />
                  <span className="mr-2 text-sm text-gray-400">#{post.id.slice(0, 4)}</span>
                </div>
                <h4 className="pr-4 text-base text-ellipsis line-clamp-3 sm:line-clamp-2 md:line-clamp-1">
                  {post.title}
                </h4>
              </div>

              <div className="flex sm:flex-row pr-4 items-start sm:items-center sm:gap-1.5 flex-col">
                <div className="flex items-center">
                  <span className="mr-1.5 text-sm text-green-500">By:</span>
                  <span className="text-sm text-gray-300">
                    {post.isAnonymous ? "Anonymous" : smallAddress(post.userKey)}
                  </span>
                </div>
                <span className="hidden text-gray-300 sm:block">-</span>
                <span className="text-sm text-gray-300 ">{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center w-full gap-3 mt-3 lg:justify-end lg:w-fit sm:min-w-fit lg:pl-4 lg:mt-0 lg:flex-row">
            <div className="items-center hidden lg:flex">
              <CategoriesTag categoryId={post.categoryId} categoryName={post.categoryName ?? "Uncategorized"} className="hidden lg:block" />
            </div>
            <div className="flex items-center justify-center w-full gap-3 sm:justify-end lg:w-fit">
              <div className="flex items-center justify-center w-1/3 gap-2 px-3 py-2 space-x-0 text-sm text-center text-green-500 border divide-x divide-white/10 border-white/10 lg:w-auto">
                <ChatBubbleLeftRightIcon className="fill-green-500" height={16} />
                {!post.commentCount ? formatInteractionNumbers(post.commentCount) : 0}
              </div>
              <div className="flex items-center justify-center w-1/3 gap-2 px-3 py-2 space-x-0 text-sm text-center text-green-500 border divide-x divide-white/10 border-white/10">
                <EyeIcon className="fill-green-500" height={16} />
                {post.viewCount ? formatInteractionNumbers(post.viewCount) : 0}
              </div>
              <VotesDisplay className="w-1/3" upVotes={post.upvotes ? formatInteractionNumbers(post.upvotes) : 0} downVotes={post.downvotes ? formatInteractionNumbers(post.downvotes) : 0} />
            </div>
          </div>
        </div>
      </Link>
    </>
  );
};
