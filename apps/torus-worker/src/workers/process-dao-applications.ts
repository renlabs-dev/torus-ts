import { match } from "rustie";

import type { WorkerProps } from "../common";
import {
  BLOCK_TIME,
  getApplications,
  getCadreThreshold,
  getVotesOnPending,
  log,
  processAllVotes,
  processCadreVotes,
  getCadreVotes,
  sleep,
  getPenaltyFactors,
  sleepUntilNewBlock,
  processPenalty,
} from "../common";

export async function processApplicationsWorker(props: WorkerProps) {
  while (true) {
    try {
      const lastBlock = await sleepUntilNewBlock(props);
      props.lastBlock = lastBlock;
      log(`Block ${props.lastBlock.blockNumber}: processing`);

      const apps_map = await getApplications(props.api, (app) =>
        match(app.status)({
          Open: () => true,
          Resolved: ({ accepted }) => accepted,
          Expired: () => false,
        }),
      );

      const votes_on_pending = await getVotesOnPending(
        apps_map,
        lastBlock.blockNumber,
      );

      const vote_threshold = await getCadreThreshold();

      await processAllVotes(
        votes_on_pending,
        vote_threshold,
        apps_map,
        props.api,
      );
      const cadreVotes = await getCadreVotes();
      await processCadreVotes(cadreVotes, vote_threshold);
      console.log("threshold: ", vote_threshold);
      const factors = await getPenaltyFactors(vote_threshold);
      await processPenalty(factors, props.api);
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(BLOCK_TIME);
    }
  }
}
