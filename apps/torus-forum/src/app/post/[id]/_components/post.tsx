
import { MarkdownView } from "@torus-ts/ui/markdown-view";
import {
  removeEmojis,
  smallAddress,
} from "@torus-ts/utils";

import Link from "next/link";

import { SectionHeaderText } from "~/app/components/section-header-text";
import { api } from "~/trpc/server";
import { PostDate } from "./date";
import { CreateComment } from "~/app/components/comments/create-comment";
import { ViewComment } from "~/app/components/comments/view-comment";
import { VotePostButton } from "./vote-post-button";
import { ExternalLink } from "lucide-react";

export async function Post(props: { postId: string }): Promise<JSX.Element> {
  const { postId } = props;
  const post = await api.forum.byId({ id: postId });

  if (!post) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen lg:h-auto">
        <h1 className="text-2xl text-white">No post found</h1>
      </div>
    )
  }

  await api.forum.incrementViewCount({ postId });

  return (
    <div className="flex flex-col w-full md:flex-row">
      <div className="flex flex-col w-full h-full lg:w-full">
        {post.href && (
          <div className="m-2 flex flex-col items-start animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-100">
            <SectionHeaderText
              text={post.title}
            />
            <Link href={post.href} target="_blank" className="flex gap-2 text-blue-500 hover:text-blue-400">
              Post Link <ExternalLink width={16} />
            </Link>
            <span className="text-sm text-gray-400 break-words">({post.href})</span>
          </div>
        )}
        {/* TODO: Bring number of views to the post page */}
        {post.content && (
          <div className="m-2 flex h-full animate-fade-down flex-col border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-100 md:max-h-[60vh] md:min-h-[50vh]">
            <div className="pb-4 mb-4 border-b border-gray-500 border-white/20">
              <span className="flex items-center text-gray-400">ID: {smallAddress(post.id, 3)}</span>

              <h2 className="mt-1 mb-1 text-lg font-bold text-gray-200 text-start">{post.title}</h2>

              <span className="flex flex-col gap-2 text-gray-400 sm:items-center sm:flex-row">
                By: {!post.isAnonymous ? smallAddress(post.userKey, 3) : "Anonymous"}
                <span className="hidden sm:block">-</span>
                <PostDate date={post.createdAt} className="text-gray-400" />
              </span>
            </div>
            <div className="h-full md:pl-1 md:pr-4 md:overflow-auto">
              {post.content && <MarkdownView source={removeEmojis(post.content)} />}
            </div>
          </div>
        )}

        <VotePostButton postId={postId} downvotes={post.downvotes} upvotes={post.upvotes} />

        <div className="w-full">
          <ViewComment postId={postId} />
        </div>
        <div className="m-2 hidden h-fit min-h-max animate-fade-down flex-col items-center justify-between border border-white/20 bg-[#898989]/5 p-6 text-white backdrop-blur-md  animate-delay-200 md:flex">
          <CreateComment postId={postId} />
        </div>
      </div>
    </div>
  );
}