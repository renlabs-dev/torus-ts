import { agentRouter } from "./router/agent/agent";
import { agentApplicationVoteRouter } from "./router/agent/agent-application-vote";
import { agentReportRouter } from "./router/agent/agent-report";
import { computedAgentWeightRouter } from "./router/agent/computed-agent-weight";
import { userAgentWeightRouter } from "./router/agent/user-agent-weight";
import { askTorusRouter } from "./router/ask-torus/ask-torus";
import { authRouter } from "./router/auth";
import { cadreRouter } from "./router/cadre/cadre";
import { cadreCandidateRouter } from "./router/cadre/cadre-candidate";
import { cadreVoteRouter } from "./router/cadre/cadre-vote";
import { cadreVoteHistoryRouter } from "./router/cadre/cadre-vote-history";
import { discordInfoRouter } from "./router/cadre/discord-info";
import { coinGeckoRouter } from "./router/coingecko/coingecko";
import { commentRouter } from "./router/comment/comment";
import { commentInteractionRouter } from "./router/comment/comment-interaction";
import { commentReportRouter } from "./router/comment/comment-report";
import { creditsRouter } from "./router/credits/credits";
import { penaltyRouter } from "./router/penalty/penalty";
import { permissionRouter } from "./router/permission/permission";
import { signalRouter } from "./router/permission/signal";
import { predictionRouter } from "./router/prediction/prediction";
import { predictionReportRouter } from "./router/prediction/prediction-report";
import { topicRouter } from "./router/prediction/topic";
import { prophetRouter } from "./router/prophet/prophet";
import { scraperQueueRouter } from "./router/scraper/scraper-queue";
import { starRouter } from "./router/star/star";
import { twitterUserRouter } from "./router/twitter/twitter-user";
import { watchRouter } from "./router/watch/watch";
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

  // Ask Torus Usage
  askTorus: askTorusRouter,

  // Cadre
  cadre: cadreRouter,
  cadreVote: cadreVoteRouter,
  cadreVoteHistory: cadreVoteHistoryRouter,
  cadreCandidate: cadreCandidateRouter,
  // CoinGecko
  coinGecko: coinGeckoRouter,

  // Comment
  comment: commentRouter,
  commentReport: commentReportRouter,
  commentInteraction: commentInteractionRouter,
  penalty: penaltyRouter,

  // Credits
  credits: creditsRouter,

  // Constraint Management (commented out due to schema incompatibility)
  // constraint: constraintRouter,

  // Discord Auth
  discordInfo: discordInfoRouter,

  // Permission
  permission: permissionRouter,
  signal: signalRouter,

  // Prediction
  prediction: predictionRouter,
  predictionReport: predictionReportRouter,
  topic: topicRouter,

  // Prophet
  prophet: prophetRouter,

  // Scraper Queue
  scraperQueue: scraperQueueRouter,

  // Twitter
  twitterUser: twitterUserRouter,

  // Watch
  watch: watchRouter,

  // Star
  star: starRouter,
});

export type AppRouter = typeof appRouter;
