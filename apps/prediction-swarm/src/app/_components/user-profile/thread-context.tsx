import type { AppRouter } from "@torus-ts/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import type { inferProcedureOutput } from "@trpc/server";
import dayjs from "dayjs";

type GroupedTweetData = inferProcedureOutput<
  AppRouter["prediction"]["getByUsername"]
>[number];

interface ThreadContextProps {
  tweet: GroupedTweetData;
}

export function ThreadContext({ tweet }: ThreadContextProps) {
  const { parentTweet, rootTweet, parentTweetId, conversationId, tweetId } =
    tweet;

  // Case 1: Standalone tweet (no thread/reply)
  if (!parentTweetId && (!conversationId || conversationId === tweetId)) {
    return null;
  }

  // Case 2: Simple reply (no thread, just replying to one tweet)
  if (parentTweet && !rootTweet) {
    return (
      <div className="mt-3 flex gap-3">
        {/* Left side: Avatar with connecting line */}
        <div className="flex flex-col items-center p-1">
          <Avatar className="h-6 w-6">
            <AvatarImage src={parentTweet.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">
              {(parentTweet.screenName ?? parentTweet.username ?? "U")
                .slice(0, 1)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="my-3 min-h-[2rem] w-0.5 flex-1 bg-white/60" />
        </div>

        {/* Right side: Tweet content */}
        <div className="flex-1 pb-3 pt-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              {parentTweet.screenName ?? parentTweet.username}
            </span>
            <span className="text-muted-foreground text-xs">
              {dayjs(parentTweet.tweetDate).format("MMM D")}
            </span>
          </div>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {parentTweet.tweetText}
          </p>
        </div>
      </div>
    );
  }

  // Case 3 & 4: Thread (with or without intermediate reply)
  if (rootTweet) {
    const isDirectThreadReply = parentTweetId === conversationId;

    return (
      <div className="space-y-0 p-1">
        {/* Root tweet */}
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <Avatar className="h-6 w-6">
              <AvatarImage src={rootTweet.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {(rootTweet.screenName ?? rootTweet.username ?? "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="my-3 min-h-[2rem] w-0.5 flex-1 bg-white/60" />
          </div>

          <div className="flex-1 pb-3 pt-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                {rootTweet.screenName ?? rootTweet.username}
              </span>
              <span className="text-muted-foreground text-xs">
                {dayjs(rootTweet.tweetDate).format("MMM D")}
              </span>
            </div>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {rootTweet.tweetText}
            </p>
          </div>
        </div>

        {/* Show parent if it's different from root (reply in middle of thread) */}
        {!isDirectThreadReply && parentTweet && (
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <Avatar className="h-6 w-6">
                <AvatarImage src={parentTweet.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {(parentTweet.screenName ?? parentTweet.username ?? "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="my-3 min-h-[2rem] w-0.5 flex-1 bg-white/60" />
            </div>

            <div className="flex-1 pb-3 pt-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  {parentTweet.screenName ?? parentTweet.username}
                </span>
                <span className="text-muted-foreground text-xs">
                  {dayjs(parentTweet.tweetDate).format("MMM D")}
                </span>
              </div>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {parentTweet.tweetText}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
