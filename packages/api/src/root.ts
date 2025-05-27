import { agentRouter } from "./router/agent/agent";
import { agentApplicationVoteRouter } from "./router/agent/agent-application-vote";
import { agentReportRouter } from "./router/agent/agent-report";
import { computedAgentWeightRouter } from "./router/agent/computed-agent-weight";
import { userAgentWeightRouter } from "./router/agent/user-agent-weight";
import { authRouter } from "./router/auth";
import { cadreRouter } from "./router/cadre/cadre";
import { cadreCandidateRouter } from "./router/cadre/cadre-candidate";
import { cadreVoteRouter } from "./router/cadre/cadre-vote";
import { cadreVoteHistoryRouter } from "./router/cadre/cadre-vote-history";
import { discordInfoRouter } from "./router/cadre/discord-info";
import { commentRouter } from "./router/comment/comment";
import { commentInteractionRouter } from "./router/comment/comment-interaction";
import { commentReportRouter } from "./router/comment/comment-report";
import { penaltyRouter } from "./router/penalty/penalty";
import { permissionRouter } from "./router/permission/permission-details";
import { constraintRouter } from "./router/constraint/constraint";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  // Auth
  auth: authRouter,
  // Agent
  agent: agentRouter,
  agentReport: agentReportRouter,
  userAgentWeight: userAgentWeightRouter,
  computedAgentWeight: computedAgentWeightRouter,
  // Agent Application
  agentApplicationVote: agentApplicationVoteRouter,

  // Cadre
  cadre: cadreRouter,
  cadreVote: cadreVoteRouter,
  cadreVoteHistory: cadreVoteHistoryRouter,
  cadreCandidate: cadreCandidateRouter,
  // Comment
  comment: commentRouter,
  commentReport: commentReportRouter,
  commentInteraction: commentInteractionRouter,
  penalty: penaltyRouter,

  // Constraint Management
  constraint: constraintRouter,

  // Discord Auth
  discordInfo: discordInfoRouter,

  // Permission
  permissionDetails: permissionRouter,
});

export type AppRouter = typeof appRouter;
