import type { WorkerProps } from "../common";
import {
  BLOCK_TIME,
  getApplications,
  getCadreThreshold,
  getVotesOnPending,
  log,
  processAllVotes,
  sleep,
  sleepUntilNewBlock,
} from "../common";

export async function processDaoApplicationsWorker(props: WorkerProps) {
  while (true) {
    try {
      const lastBlock = await sleepUntilNewBlock(props);
      log(`Block ${props.lastBlock.blockNumber}: processing`);

      const apps_map = await getApplications(props.api, [
        "Pending",
        "Accepted",
      ]);

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
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(BLOCK_TIME);
      continue;
    }
  }
}
