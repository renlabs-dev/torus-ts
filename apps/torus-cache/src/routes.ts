import { Router } from "express";

import {
  getStakeFromDataStringified,
  getStakeOutDataStringified,
  stakeFromData,
  stakeOutData,
} from "./data";
import { waitFor } from "./utils";

const router: Router = Router();

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get("/api/stake-out", async (req, res) => {
  const hasData = () => stakeOutData.atBlock !== -1n;

  await waitFor(
    `request ${req.ip}`,
    "StakeOut data",
    2000,
    50_000,
    hasData,
    true,
  );

  if (!hasData()) {
    res.status(503).send("StakeOut data not available yet");
    return;
  }
  res
    .header("Content-Type", "application/json")
    .send(getStakeOutDataStringified());
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get("/api/stake-from", async (req, res) => {
  const hasData = () => stakeFromData.atBlock !== -1n;

  await waitFor(
    `request ${req.ip}`,
    "StakeFrom data",
    2000,
    50_000,
    hasData,
    true,
  );

  if (!hasData()) {
    res.status(503).send("StakeFrom data not available yet");
    return;
  }
  res
    .header("Content-Type", "application/json")
    .send(getStakeFromDataStringified());
});

router.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

router.get("/api/health/details", (req, res) => {
  res.json({
    status: "ok",
    lastBlock: Number(stakeOutData.atBlock),
    atTime: stakeOutData.atTime,
    deltaSeconds: (new Date().getTime() - stakeOutData.atTime.getTime()) / 1000,
  });
});

export default router;
