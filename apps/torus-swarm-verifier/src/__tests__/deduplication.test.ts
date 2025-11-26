import type { PostSlice } from "@torus-ts/db/schema";
import { describe, expect, it } from "vitest";
import type { ParsedPredictionForDedup } from "../verifier.js";
import { comparePredictions } from "../verifier.js";

/**
 * Represents a tweet with its text content.
 * This is the source of truth - slices reference positions within this text.
 */
interface TestTweet {
  id: string;
  text: string;
}

function createSlice(tweet: TestTweet, start: number, end: number): PostSlice {
  if (start < 0 || end > tweet.text.length || start >= end) {
    throw new Error(
      `Invalid slice [${start}, ${end}] for tweet "${tweet.id}" with length ${tweet.text.length}`,
    );
  }
  return { source: { tweet_id: tweet.id }, start, end };
}

function sliceOf(tweet: TestTweet, substring: string): PostSlice {
  const start = tweet.text.indexOf(substring);
  if (start === -1) {
    throw new Error(
      `Substring "${substring}" not found in tweet "${tweet.id}": "${tweet.text}"`,
    );
  }
  return createSlice(tweet, start, start + substring.length);
}

function makePrediction(
  id: string,
  target: PostSlice[],
  timeframe: PostSlice[],
): ParsedPredictionForDedup {
  return { id, predictionId: `pred_${id}`, target, timeframe };
}

// Shared tweet fixtures
const TWEETS = {
  btc100k: {
    id: "tweet_btc_100k",
    text: "BTC will hit $100k by end of 2025",
  },
  btcEth: {
    id: "tweet_btc_eth",
    text: "BTC will hit $100k and ETH will reach $5k by Q1 2025",
  },
  ethFlip: {
    id: "tweet_eth_flip",
    text: "ETH will flip BTC in 2026",
  },
  btc95k: {
    id: "tweet_btc_95k",
    text: "BTC will reach $95k by end of 2025",
  },
  thread1: {
    id: "tweet_thread_1",
    text: "BTC is going to the moon",
  },
  thread2: {
    id: "tweet_thread_2",
    text: "I mean it will hit $100k",
  },
  thread3: {
    id: "tweet_thread_3",
    text: "by end of year for sure",
  },
  multiPred: {
    id: "tweet_multi_pred",
    text: "BTC will hit $100k ETH will hit $10k SOL will reach $200 by 2025",
  },
  long: {
    id: "tweet_long",
    text: "BTC $100k is inevitable, here is why I think so, lots of filler text here to create distance, for sure it will happen",
  },
  overlap: {
    id: "tweet_overlap",
    text: "BTC will hit $100k soon by 2025",
  },
  transitivity: {
    id: "tweet_transitivity",
    text: "BTC will definitely hit $100k by the end of 2025 for sure based on institutional adoption and increasing market trends. The halving cycle supports this thesis strongly. Major corporations are accumulating. ETF inflows continue at record pace. Supply shock incoming soon.",
  },
} as const satisfies Record<string, TestTweet>;

describe("prediction deduplication", () => {
  describe("identical and near-identical extractions", () => {
    it("marks identical extractions from same tweet as duplicates", () => {
      const tweet = TWEETS.btc100k;
      const pred1 = makePrediction(
        "1a",
        [sliceOf(tweet, "BTC will hit $100k")],
        [sliceOf(tweet, "by end of 2025")],
      );
      const pred2 = makePrediction(
        "1b",
        [sliceOf(tweet, "BTC will hit $100k")],
        [sliceOf(tweet, "by end of 2025")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(true);
      expect(result.targetScore).toBe(1);
      expect(result.timeframeScore).toBe(1);
    });

    it("marks same span with different slice boundaries as duplicates", () => {
      const tweet = TWEETS.btc100k;
      const pred1 = makePrediction(
        "2a",
        [sliceOf(tweet, "BTC will hit $100k")],
        [sliceOf(tweet, "2025")],
      );
      const pred2 = makePrediction(
        "2b",
        [sliceOf(tweet, "BTC will"), sliceOf(tweet, " hit $100k")],
        [sliceOf(tweet, "2025")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(true);
      expect(result.targetScore).toBe(1);
    });

    it("marks adjacent slices vs single slice as duplicates", () => {
      const tweet = TWEETS.btc100k;
      const pred1 = makePrediction(
        "13a",
        [createSlice(tweet, 0, 8), createSlice(tweet, 8, 18)],
        [sliceOf(tweet, "2025")],
      );
      const pred2 = makePrediction(
        "13b",
        [sliceOf(tweet, "BTC will hit $100k")],
        [sliceOf(tweet, "2025")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(true);
    });

    it("marks out-of-order slices as duplicates", () => {
      const tweet = TWEETS.btc100k;
      const pred1 = makePrediction(
        "11a",
        [sliceOf(tweet, "BTC"), sliceOf(tweet, "will"), sliceOf(tweet, "hit")],
        [sliceOf(tweet, "2025")],
      );
      const pred2 = makePrediction(
        "11b",
        [sliceOf(tweet, "hit"), sliceOf(tweet, "will"), sliceOf(tweet, "BTC")],
        [sliceOf(tweet, "2025")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(true);
    });

    it("marks overlapping slices within prediction as duplicates", () => {
      const tweet = TWEETS.overlap;
      const pred1 = makePrediction(
        "10a",
        [sliceOf(tweet, "BTC will hit"), sliceOf(tweet, "hit $100k")],
        [sliceOf(tweet, "2025")],
      );
      const pred2 = makePrediction(
        "10b",
        [sliceOf(tweet, "BTC will hit"), sliceOf(tweet, "hit $100k")],
        [sliceOf(tweet, "2025")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(true);
    });
  });

  describe("cross-tweet predictions (threads)", () => {
    it("marks identical cross-tweet extractions as duplicates", () => {
      const t1 = TWEETS.thread1;
      const t2 = TWEETS.thread2;
      const t3 = TWEETS.thread3;

      const pred1 = makePrediction(
        "6a",
        [
          sliceOf(t1, "BTC is going to the moon"),
          sliceOf(t2, "it will hit $100k"),
        ],
        [sliceOf(t3, "by end of year")],
      );
      const pred2 = makePrediction(
        "6b",
        [
          sliceOf(t1, "BTC is going to the moon"),
          sliceOf(t2, "it will hit $100k"),
        ],
        [sliceOf(t3, "by end of year")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(true);
    });

    it("rejects cross-tweet partial extraction as not duplicates", () => {
      const t1 = TWEETS.thread1;
      const t2 = TWEETS.thread2;
      const t3 = TWEETS.thread3;

      const pred1 = makePrediction(
        "7a",
        [
          sliceOf(t1, "BTC is going to the moon"),
          sliceOf(t2, "it will hit $100k"),
        ],
        [sliceOf(t3, "by end of year")],
      );
      const pred2 = makePrediction(
        "7b",
        [sliceOf(t2, "it will hit $100k")],
        [sliceOf(t3, "by end of year")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(false);
      expect(result.targetScore).toBeLessThan(0.96);
    });
  });

  describe("superset and subset extractions", () => {
    it("rejects superset extraction as not duplicates", () => {
      const tweet = TWEETS.btcEth;
      const pred1 = makePrediction(
        "3a",
        [sliceOf(tweet, "BTC will hit $100k")],
        [sliceOf(tweet, "by Q1 2025")],
      );
      const pred2 = makePrediction(
        "3b",
        [sliceOf(tweet, "BTC will hit $100k and ETH will reach $5k")],
        [sliceOf(tweet, "by Q1 2025")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(false);
      expect(result.targetScore).toBeLessThan(0.5);
    });

    it("rejects asymmetric containment as not duplicates", () => {
      const tweet = TWEETS.btc100k;
      const pred1 = makePrediction(
        "12a",
        [sliceOf(tweet, "BTC")],
        [sliceOf(tweet, "2025")],
      );
      const pred2 = makePrediction(
        "12b",
        [sliceOf(tweet, "BTC will hit $100k")],
        [sliceOf(tweet, "2025")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(false);
      expect(result.targetScore).toBeLessThan(0.2);
    });

    it("rejects single vs multiple targets as not duplicates", () => {
      const tweet = TWEETS.multiPred;
      const pred1 = makePrediction(
        "18a",
        [sliceOf(tweet, "BTC will hit $100k")],
        [sliceOf(tweet, "2025")],
      );
      const pred2 = makePrediction(
        "18b",
        [
          sliceOf(tweet, "BTC will hit $100k"),
          sliceOf(tweet, "ETH will hit $10k"),
        ],
        [sliceOf(tweet, "2025")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(false);
      expect(result.targetScore).toBe(0.5);
    });
  });

  describe("different tweets", () => {
    it("rejects different tweets as not duplicates with zero overlap", () => {
      const pred1 = makePrediction(
        "4a",
        [sliceOf(TWEETS.btc100k, "BTC will hit $100k")],
        [sliceOf(TWEETS.btc100k, "2025")],
      );
      const pred2 = makePrediction(
        "4b",
        [sliceOf(TWEETS.ethFlip, "ETH will flip BTC")],
        [sliceOf(TWEETS.ethFlip, "2026")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(false);
      expect(result.targetScore).toBe(0);
      expect(result.timeframeScore).toBe(0);
    });

    it("rejects same text from different tweets as not duplicates", () => {
      const pred1 = makePrediction(
        "5a",
        [sliceOf(TWEETS.btc100k, "BTC will")],
        [sliceOf(TWEETS.btc100k, "end of 2025")],
      );
      const pred2 = makePrediction(
        "5b",
        [sliceOf(TWEETS.btc95k, "BTC will")],
        [sliceOf(TWEETS.btc95k, "end of 2025")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(false);
      expect(result.targetScore).toBe(0);
    });
  });

  describe("gap handling", () => {
    it("marks identical discontiguous slices as duplicates", () => {
      const tweet = TWEETS.long;
      const pred1 = makePrediction(
        "8a",
        [sliceOf(tweet, "BTC $100k"), sliceOf(tweet, "for sure")],
        [sliceOf(tweet, "happen")],
      );
      const pred2 = makePrediction(
        "8b",
        [sliceOf(tweet, "BTC $100k"), sliceOf(tweet, "for sure")],
        [sliceOf(tweet, "happen")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(true);
    });

    it("rejects gap vs contiguous as not duplicates", () => {
      const tweet = TWEETS.long;
      const pred1 = makePrediction(
        "9a",
        [sliceOf(tweet, "BTC $100k"), sliceOf(tweet, "for sure")],
        [sliceOf(tweet, "happen")],
      );
      const pred2 = makePrediction(
        "9b",
        [sliceOf(tweet, "BTC $100k is inevitable")],
        [sliceOf(tweet, "happen")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(false);
    });

    it("merges 1-char gap between slices", () => {
      const tweet = TWEETS.btc100k;
      const pred1 = makePrediction(
        "14a",
        [createSlice(tweet, 0, 8), createSlice(tweet, 9, 18)],
        [sliceOf(tweet, "2025")],
      );
      const pred2 = makePrediction(
        "14b",
        [sliceOf(tweet, "BTC will hit $100k")],
        [sliceOf(tweet, "2025")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(true);
    });

    it("does not merge 2-char gap between slices", () => {
      const tweet = TWEETS.btc100k;
      const pred1 = makePrediction(
        "15a",
        [createSlice(tweet, 0, 8), createSlice(tweet, 10, 18)],
        [sliceOf(tweet, "2025")],
      );
      const pred2 = makePrediction(
        "15b",
        [sliceOf(tweet, "BTC will hit $100k")],
        [sliceOf(tweet, "2025")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(false);
      expect(result.targetScore).toBeLessThan(0.96);
    });
  });

  describe("edge cases", () => {
    it("handles empty target arrays", () => {
      const tweet = TWEETS.btc100k;
      const pred1 = makePrediction("16a", [], [sliceOf(tweet, "2025")]);
      const pred2 = makePrediction("16b", [], [sliceOf(tweet, "2025")]);

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(false);
      expect(result.targetScore).toBe(0);
    });

    it("rejects partial overlap as not duplicates", () => {
      const tweet = TWEETS.multiPred;
      const pred1 = makePrediction(
        "17a",
        [
          sliceOf(tweet, "BTC will hit $100k"),
          sliceOf(tweet, "ETH will hit $10k"),
        ],
        [sliceOf(tweet, "2025")],
      );
      const pred2 = makePrediction(
        "17b",
        [
          sliceOf(tweet, "BTC will hit $100k"),
          sliceOf(tweet, "SOL will reach $200"),
        ],
        [sliceOf(tweet, "2025")],
      );

      const result = comparePredictions(pred1, pred2);

      expect(result.isDuplicate).toBe(false);
      expect(result.targetScore).toBeLessThan(0.5);
    });
  });

  describe("transitivity", () => {
    it("demonstrates transitivity failure: A≈B and B≈C but A≉C", () => {
      const tweet = TWEETS.transitivity;
      const N = 250;

      const pred1 = makePrediction(
        "19a",
        [createSlice(tweet, 0, N)],
        [sliceOf(tweet, "2025")],
      );
      const pred2 = makePrediction(
        "19b",
        [createSlice(tweet, 10, N)],
        [sliceOf(tweet, "2025")],
      );
      const pred3 = makePrediction(
        "19c",
        [createSlice(tweet, 15, N)],
        [sliceOf(tweet, "2025")],
      );

      const r1v2 = comparePredictions(pred1, pred2);
      const r2v3 = comparePredictions(pred2, pred3);
      const r1v3 = comparePredictions(pred1, pred3);

      // A≈B: 240/250 = 0.96
      expect(r1v2.isDuplicate).toBe(true);
      expect(r1v2.targetScore).toBeCloseTo(0.96, 2);

      // B≈C: 235/240 ≈ 0.979
      expect(r2v3.isDuplicate).toBe(true);
      expect(r2v3.targetScore).toBeGreaterThan(0.96);

      // A≉C: 235/250 = 0.94
      expect(r1v3.isDuplicate).toBe(false);
      expect(r1v3.targetScore).toBeCloseTo(0.94, 2);
    });
  });
});
