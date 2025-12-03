# Prediction Deduplication System

## Overview

The Prediction Swarm filters predictions from Twitter threads, with multiple filters potentially processing the same source tweets. This creates a deduplication problem where the same prediction appears multiple times with slightly different slice boundaries or from different filters.

This system detects and removes duplicate predictions based on slice overlap and content similarity.

## The Problem

Duplicates can arise from two scenarios:

### 1. Different Filters Processing the Same Tweet

Multiple filter agents independently process the same scraped tweet and create different parsed predictions:

```
Tweet: "BTC will hit $100k by Q1"

Filter A extracts:
  Target: ["BTC will hit $100k"]
  Timeframe: ["Q1"]

Filter B extracts:
  Target: ["BTC will hit $100k"]
  Timeframe: ["Q1"]

Result: Duplicate predictions from different filters
```

### 2. Same Filter Processing Different Tweets in Same Thread

A filter processes multiple tweets in a conversation thread where the prediction spans multiple tweets:

```
Tweet 100: "BTC is going to the moon"
Tweet 101: "I mean it will hit $100k"
Tweet 102: "by end of Q1"

Filter processes tweet 100:
  Creates prediction with slices from 100, 101, 102

Filter processes tweet 101:
  Creates another prediction with overlapping slices from 101, 102

Result: Same prediction sourced from different tweets in the thread
```

## Solution Architecture

### Database Schema

Created a separate table for tracking duplicate relationships:

```sql
CREATE TABLE prediction_duplicate_relations (
  prediction_id VARCHAR(256) NOT NULL,
  canonical_id VARCHAR(256) NOT NULL,
  similarity_score NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (prediction_id, canonical_id)
);
```

**Key Design Decisions:**

- **Additive pattern**: Uses `ON CONFLICT DO NOTHING` for race-safe concurrent inserts
- **Separate table**: Doesn't modify predictions directly, allowing multiple deduplication processes to run simultaneously
- **Transitive relationships**: CTE query resolves chains (A→B→C all collapse to canonical A)

### Deduplication Algorithm

The algorithm determines duplicates through bidirectional coverage analysis:

#### Stage 1: Merge Adjacent Slices

Slices within the same tweet that are adjacent or have a 1-character gap are merged into unified ranges:

```
Pred slices: [0-8], [9-18] from same tweet
Merged: [0-18] (1-char gap at position 8 is tolerated)

Pred slices: [0-8], [10-18] from same tweet
Merged: [0-8], [10-18] (2-char gap keeps them separate)
```

#### Stage 2: Calculate Coverage

For each tweet, calculate what portion of one prediction's ranges are covered by the other's:

```
Pred1: [0-18] (18 chars)
Pred2: [0-10], [15-18] (13 chars total)

Coverage of Pred1 by Pred2:
  [0-10] covers 10 chars of [0-18]
  [15-18] covers 3 chars of [0-18]
  Total: 13/18 = 0.722
```

#### Stage 3: Bidirectional Minimum

Calculate coverage in both directions and take the **minimum**:

```
Coverage A→B: How much of A is covered by B
Coverage B→A: How much of B is covered by A
Final score = MIN(Coverage A→B, Coverage B→A)
```

Using minimum ensures extra content in either prediction significantly reduces the score. A superset prediction won't be marked as duplicate.

#### Stage 4: Threshold Check

```
Duplicate if:
  target_score ≥ 0.96 AND timeframe_score ≥ 0.96
```

## Algorithm Behavior Examples

### ✅ Duplicate: Same Content, Different Slice Boundaries

```
Tweet: "BTC will hit $100k by EOY 2025"
Pred1 extracts: [0-25] as single slice
Pred2 extracts: [0-12], [12-18], [18-25] as three slices

Both cover the same positions → score: 1.000
Result: DUPLICATE ✅
```

### ❌ Not Duplicate: Superset Prediction

```
Tweet: "BTC will hit $100k and ETH will reach $5k by Q1"
Pred1 extracts: [0-18] "BTC will hit $100k"
Pred2 extracts: [0-41] "BTC will hit $100k and ETH will reach $5k"

Coverage Pred1→Pred2: 18/18 = 1.0 (Pred2 fully covers Pred1)
Coverage Pred2→Pred1: 18/41 = 0.44 (Pred1 only covers 44% of Pred2)
Bidirectional min: 0.44
Result: NOT DUPLICATE ✅
```

### ❌ Not Duplicate: Partial Overlap from Same Tweet

```
Tweet: "BTC will hit $100k ETH will hit $10k SOL will reach $200 by 2025"
Pred1 extracts: "BTC will hit $100k" + "ETH will hit $10k"
Pred2 extracts: "BTC will hit $100k" + "SOL will reach $200"

Only the first part overlaps, second parts are different positions.
Target score: 0.486
Result: NOT DUPLICATE ✅
```

### ❌ Not Duplicate: Different Tweets

```
Tweet A: "BTC will hit $100k by 2025"
Tweet B: "BTC will hit $100k by 2025" (different tweet, same text)

Pred1 extracts from Tweet A
Pred2 extracts from Tweet B

Different tweet IDs → score: 0.000
Result: NOT DUPLICATE ✅
```

## Configuration

### Thresholds

```typescript
targetThreshold = 0.96; // 96% similarity required for target
timeframeThreshold = 0.96; // 96% similarity required for timeframe
```

Both thresholds must be met for predictions to be considered duplicates.

### Tuning Guidelines

- **Higher threshold (0.98+)**: More conservative, fewer false positives, but may miss legitimate duplicates with small gaps
- **Lower threshold (0.90-0.95)**: More aggressive, catches more duplicates, but may incorrectly merge predictions with partial overlap
- **Current (0.96)**: Balanced approach that correctly handles:
  - Different slicing strategies (duplicate)
  - Superset predictions (not duplicate)
  - Partial overlaps (not duplicate)

## Canonical Resolution

Query uses recursive CTE to resolve duplicate chains:

```sql
WITH RECURSIVE duplicate_graph AS (
  -- Start with all predictions
  SELECT id, id as root_id, 0 as depth
  FROM parsed_predictions

  UNION

  -- Follow duplicate chains
  SELECT dr.prediction_id, dg.root_id, dg.depth + 1
  FROM duplicate_graph dg
  JOIN prediction_duplicate_relations dr ON dr.canonical_id = dg.id
  WHERE dg.depth < 10
),
canonical_map AS (
  -- Pick lowest ID as canonical
  SELECT id, MIN(root_id) as canonical_id
  FROM duplicate_graph
  GROUP BY id
)
SELECT * FROM parsed_predictions p
JOIN canonical_map cm ON cm.id = p.id
WHERE p.id = cm.canonical_id
```

This ensures:

- Transitive relationships are resolved (A→B→C all map to A)
- Cycles are broken deterministically (MIN(id))
- Depth limit prevents infinite loops

## Testing

Test suite with 18 cases covering position-based overlap scenarios. Tests use real tweet definitions as source of truth, ensuring slices reference valid positions.

1. Identical extractions from same tweet
2. Same span, different slice boundaries
3. Superset extraction (extra content)
4. Different tweets entirely (zero overlap)
5. Same text from different tweets (not duplicates)
6. Cross-tweet thread (identical extractions)
7. Cross-tweet partial extraction
8. Large gap between slices (identical discontiguous)
9. Gap vs contiguous spans
10. Overlapping slices within prediction
11. Out-of-order slices
12. Asymmetric containment (subset vs full)
13. Adjacent slices vs single slice
14. 1-char gap merge tolerance
15. 2-char gap coverage penalty
16. Empty target arrays
17. Partial overlap (shared and different content)
18. Single vs multiple targets

Run tests:

```sh
pnpm --filter torus-swarm-verifier dev --test
```

## Integration Points

### When to Run Deduplication

Options for triggering deduplication:

1. **Just-in-Time** (recommended for initial implementation)
   - Run deduplication when verifier queries for predictions
   - Ensures duplicates are removed before verification
   - Simple, no additional infrastructure

2. **Post-Insert Hook**
   - Deduplicate immediately after filter stores predictions
   - Can be async (fire-and-forget)
   - May slow down filter inserts if awaited

3. **Periodic Background Job**
   - Run deduplication every N minutes
   - Decoupled from other operations
   - Delay before duplicates are detected

### Usage Example

```typescript
import { comparePredictions, type ParsedPredictionForDedup } from "./verifier";

// Fetch predictions for a conversation
const predictions = await fetchPredictionsForConversation(conversationId);

// Compare all pairs
const duplicateClusters = new Map<string, string[]>();

for (let i = 0; i < predictions.length; i++) {
  for (let j = i + 1; j < predictions.length; j++) {
    const result = comparePredictions(predictions[i], predictions[j]);

    if (result.isDuplicate) {
      // Store duplicate relationship
      const canonicalId = predictions[i].id;
      const duplicateId = predictions[j].id;

      if (!duplicateClusters.has(canonicalId)) {
        duplicateClusters.set(canonicalId, []);
      }
      duplicateClusters.get(canonicalId)!.push(duplicateId);
    }
  }
}

// Store relationships in database
await storeDuplicateRelationships(tx, duplicateClusters);
```

## Key Insights

1. **Position-Based Comparison**: The algorithm compares slice positions within tweets, not text content. Same text from different tweets has zero overlap.

2. **Merge Tolerance**: Adjacent slices and slices with 1-character gaps merge into unified ranges, handling different slicing granularities.

3. **Bidirectional Minimum**: Taking MIN of both coverage directions prevents supersets from being marked as duplicates. Extra content in either prediction significantly reduces the score.

4. **Race-Safe Design**: Additive pattern with separate relations table allows concurrent deduplication without conflicts.

5. **High Threshold**: 96% coverage requirement ensures high precision while maintaining recall for legitimate duplicates.
