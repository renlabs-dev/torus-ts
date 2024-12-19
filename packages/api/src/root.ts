import { authRouter } from "./router/auth";
import { daoRouter } from "./router/dao";
import { forumRouter } from "./router/forum";
import { moduleRouter } from "./router/module";
import { proposalCommentRouter } from "./router/proposal-comment";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  dao: daoRouter,
  module: moduleRouter,
  proposalComment: proposalCommentRouter,
  forum: forumRouter,
});

export type AppRouter = typeof appRouter;
