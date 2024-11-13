import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { MarkdownView } from "@torus-ts/ui/markdown-view";
import { removeEmojisLmao } from "@torus-ts/utils";
import { smallAddress } from "@torus-ts/utils/subspace";

import { CreateComment } from "~/app/components/comments/create-comment";
import { ViewComment } from "~/app/components/comments/view-comment";
import { SectionHeaderText } from "~/app/components/section-header-text";
import { api } from "~/trpc/server";
import { PostDate } from "./date";
import { VotePostButton } from "./vote-post-button";

export async function Post(props: { postId: string }): Promise<JSX.Element> {
  const { postId } = props;
  const post = await api.forum.byId({ id: postId });

  if (!post) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center lg:h-auto">
        <h1 className="text-2xl text-white">No post found</h1>
      </div>
    );
  }

  await api.forum.incrementViewCount({ postId });

  return (
    <div className="flex w-full flex-col md:flex-row">
      <div className="flex h-full w-full flex-col lg:w-full">
        {post.href && (
          <div className="m-2 flex animate-fade-down flex-col items-start border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-100">
            <SectionHeaderText text={post.title} />
            <Link
              href={post.href}
              target="_blank"
              className="flex gap-2 text-blue-500 hover:text-blue-400"
            >
              Post Link <ExternalLink width={16} />
            </Link>
            <span className="break-words text-sm text-gray-400">
              ({post.href})
            </span>
          </div>
        )}
        {/* TODO: Bring number of views to the post page */}
        {post.content && (
          <div className="m-2 flex h-full animate-fade-down flex-col border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-100 md:max-h-[60vh] md:min-h-[50vh]">
            <div className="mb-4 border-b border-gray-500 border-white/20 pb-4">
              <span className="flex items-center text-gray-400">
                ID: {smallAddress(post.id, 3)}
              </span>

              <h2 className="mb-1 mt-1 text-start text-lg font-bold text-gray-200">
                {post.title}
              </h2>

              <span className="flex flex-col gap-2 text-gray-400 sm:flex-row sm:items-center">
                By:{" "}
                {!post.isAnonymous
                  ? smallAddress(post.userKey, 3)
                  : "Anonymous"}
                <span className="hidden sm:block">-</span>
                <PostDate date={post.createdAt} className="text-gray-400" />
              </span>
            </div>
            <div className="h-full md:overflow-auto md:pl-1 md:pr-4">
              {post.content && (
                <MarkdownView source={removeEmojisLmao(post.content)} />
              )}
            </div>
          </div>
        )}

        <VotePostButton
          postId={postId}
          downvotes={post.downvotes}
          upvotes={post.upvotes}
        />

        <div className="w-full">
          <ViewComment postId={postId} />
        </div>
        <div className="m-2 hidden h-fit min-h-max animate-fade-down flex-col items-center justify-between border border-white/20 bg-[#898989]/5 p-6 text-white backdrop-blur-md animate-delay-200 md:flex">
          <CreateComment postId={postId} />
        </div>
      </div>
    </div>
  );
}
