import type { AppRouter } from "@torus-ts/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import type { inferProcedureOutput } from "@trpc/server";
import dayjs from "dayjs";
import { CornerDownRight } from "lucide-react";

type GroupedTweetData = inferProcedureOutput<
  AppRouter["prediction"]["getByUsername"]
>[number];

interface ThreadContextProps {
  tweet: GroupedTweetData;
}

export function ThreadContext({ tweet }: ThreadContextProps) {
  const { parentTweet, rootTweet, parentTweetId, conversationId, tweetId } =
    tweet;

  console.log("ThreadContext:", {
    tweetId,
    conversationId,
    parentTweetId,
    hasParentTweet: !!parentTweet,
    hasRootTweet: !!rootTweet,
  });

  // Case 1: Standalone tweet (no thread/reply)
  if (!parentTweetId && (!conversationId || conversationId === tweetId)) {
    return null;
  }

  // Case 2: Simple reply (no thread, just replying to one tweet)
  if (parentTweet && !rootTweet) {
    return (
      <div className="mb-3 space-y-2">
        {/* Parent tweet */}
        <div className="border-border bg-muted/30 rounded-lg border p-3">
          <div className="mb-2 flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={parentTweet.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {(parentTweet.screenName ?? parentTweet.username ?? "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-xs font-medium">
              {parentTweet.screenName ?? parentTweet.username}
            </span>
            <span className="text-muted-foreground text-xs">
              {dayjs(parentTweet.tweetDate).format("MMM D, YYYY")}
            </span>
          </div>
          <p className="text-muted-foreground line-clamp-3 text-sm">
            {parentTweet.tweetText}
          </p>
        </div>

        {/* Reply indicator */}
        <div className="flex items-center gap-2 pl-3">
          <CornerDownRight className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-xs">
            Replying to @{parentTweet.username}
          </span>
        </div>
      </div>
    );
  }

  // Case 3 & 4: Thread (with or without intermediate reply)
  if (rootTweet) {
    const isDirectThreadReply = parentTweetId === conversationId;

    return (
      <div className="mb-3 space-y-2">
        {/* Root tweet */}
        <div className="border-border bg-muted/30 rounded-lg border p-3">
          <div className="mb-2 flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={rootTweet.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {(rootTweet.screenName ?? rootTweet.username ?? "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-xs font-medium">
              {rootTweet.screenName ?? rootTweet.username}
            </span>
            <span className="text-muted-foreground text-xs">
              {dayjs(rootTweet.tweetDate).format("MMM D, YYYY")}
            </span>
          </div>
          <p className="text-muted-foreground line-clamp-3 text-sm">
            {rootTweet.tweetText}
          </p>
        </div>

        {/* Show parent if it's different from root (reply in middle of thread) */}
        {!isDirectThreadReply && parentTweet && (
          <>
            <div className="flex items-center gap-2 pl-3">
              <div className="text-muted-foreground text-xs">...</div>
            </div>
            <div className="border-border bg-muted/30 rounded-lg border p-3">
              <div className="mb-2 flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={parentTweet.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {(parentTweet.screenName ?? parentTweet.username ?? "U")
                      .slice(0, 1)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground text-xs font-medium">
                  {parentTweet.screenName ?? parentTweet.username}
                </span>
                <span className="text-muted-foreground text-xs">
                  {dayjs(parentTweet.tweetDate).format("MMM D, YYYY")}
                </span>
              </div>
              <p className="text-muted-foreground line-clamp-3 text-sm">
                {parentTweet.tweetText}
              </p>
            </div>
          </>
        )}

        {/* Reply indicator */}
        <div className="flex items-center gap-2 pl-3">
          <CornerDownRight className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-xs">
            Replying in thread
          </span>
        </div>
      </div>
    );
  }

  return null;
}
