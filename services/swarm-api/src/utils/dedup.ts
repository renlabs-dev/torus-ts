import type { PostSlice } from "@torus-ts/db/schema";

function groupSlicesByTweet(slices: PostSlice[]): Map<string, PostSlice[]> {
  const byTweet = new Map<string, PostSlice[]>();
  for (const slice of slices) {
    const group = byTweet.get(slice.source.tweet_id);
    if (group) group.push(slice);
    else byTweet.set(slice.source.tweet_id, [slice]);
  }
  return byTweet;
}

interface Range {
  start: number;
  end: number;
}

function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const first = sorted[0];
  if (!first) return [];

  const merged: Range[] = [first];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (!current || !last) continue;

    if (current.start <= last.end + 1) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function calculateCoverageAwareOverlap(
  slices1: PostSlice[],
  slices2: PostSlice[],
): number {
  if (slices1.length === 0 || slices2.length === 0) {
    return 0;
  }

  const slicesByTweet1 = groupSlicesByTweet(slices1);
  const slicesByTweet2 = groupSlicesByTweet(slices2);

  let totalCoveredLength = 0;
  let totalLength1 = 0;

  for (const [tweetId, tweet1Slices] of slicesByTweet1) {
    const tweet2Slices = slicesByTweet2.get(tweetId) ?? [];

    const merged1 = mergeRanges(
      tweet1Slices.map((s) => ({ start: s.start, end: s.end })),
    );
    const merged2 = mergeRanges(
      tweet2Slices.map((s) => ({ start: s.start, end: s.end })),
    );

    for (const r1 of merged1) {
      const r1Length = r1.end - r1.start;
      totalLength1 += r1Length;

      let coveredLength = 0;
      for (const r2 of merged2) {
        const overlapStart = Math.max(r1.start, r2.start);
        const overlapEnd = Math.min(r1.end, r2.end);
        coveredLength += Math.max(0, overlapEnd - overlapStart);
      }

      totalCoveredLength += coveredLength;
    }
  }

  if (totalLength1 === 0) return 0;

  return totalCoveredLength / totalLength1;
}

function calculateBidirectionalOverlap(
  slices1: PostSlice[],
  slices2: PostSlice[],
): number {
  const overlap1to2 = calculateCoverageAwareOverlap(slices1, slices2);
  const overlap2to1 = calculateCoverageAwareOverlap(slices2, slices1);

  return Math.min(overlap1to2, overlap2to1);
}

export interface ParsedPredictionForDedup {
  id: string;
  predictionId: string;
  target: PostSlice[];
  timeframe: PostSlice[];
}

export interface PredictionComparisonResult {
  targetScore: number;
  timeframeScore: number;
  isDuplicate: boolean;
}

export function comparePredictions(
  pred1: ParsedPredictionForDedup,
  pred2: ParsedPredictionForDedup,
  targetThreshold = 0.96,
  timeframeThreshold = 0.96,
): PredictionComparisonResult {
  const targetScore = calculateBidirectionalOverlap(pred1.target, pred2.target);
  const timeframeScore = calculateBidirectionalOverlap(
    pred1.timeframe,
    pred2.timeframe,
  );

  return {
    targetScore,
    timeframeScore,
    isDuplicate:
      targetScore >= targetThreshold && timeframeScore >= timeframeThreshold,
  };
}

export function findCanonicalPrediction(
  predictionId: string,
  predictions: ParsedPredictionForDedup[],
): { canonicalId: string; similarityScore: number } | null {
  if (predictions.length < 2) return null;

  const parent = new Map<string, string>();
  for (const pred of predictions) {
    parent.set(pred.id, pred.id);
  }

  function find(id: string): string {
    const p = parent.get(id);
    if (p === undefined || p === id) return id;
    const root = find(p);
    parent.set(id, root);
    return root;
  }

  function union(id1: string, id2: string): void {
    const root1 = find(id1);
    const root2 = find(id2);
    if (root1 === root2) return;
    if (root1 < root2) {
      parent.set(root2, root1);
    } else {
      parent.set(root1, root2);
    }
  }

  for (let i = 0; i < predictions.length; i++) {
    for (let j = i + 1; j < predictions.length; j++) {
      const pred1 = predictions[i];
      const pred2 = predictions[j];
      if (!pred1 || !pred2) continue;

      if (comparePredictions(pred1, pred2).isDuplicate) {
        union(pred1.id, pred2.id);
      }
    }
  }

  const root = find(predictionId);
  if (root === predictionId) return null;

  const canonical = predictions.find((p) => p.id === root);
  if (!canonical) return null;

  const currentPred = predictions.find((p) => p.id === predictionId);
  if (!currentPred) return null;

  const result = comparePredictions(currentPred, canonical);
  return {
    canonicalId: root,
    similarityScore: (result.targetScore + result.timeframeScore) / 2,
  };
}
