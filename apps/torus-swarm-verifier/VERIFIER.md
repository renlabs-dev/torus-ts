# Torus Swarm Verifier Architecture

## Overview

The verifier is the third stage in the prediction pipeline, following the scraper and filter. It takes parsed predictions from filter agents and determines their truth value through validation, context assembly, web search, and LLM-based verdict generation.

## Pipeline Context

**Full Flow:**

1. **Scraper**: Fetches tweets from tracked users and builds thread context
2. **Filter**: Parses tweets to extract predictions with goals, timeframes, and topics
3. **Verifier**: Validates predictions and determines truth value (we are here)
4. **Analytics**: Aggregates verdict data for insights and scoring

## Data Model Review

### Parsed Predictions

Each `parsedPredictionSchema` entry represents a complete prediction extracted from tweets:

```typescript
{
  id: uuid,
  predictionId: uuid,  // Links to parent prediction
  goal: PostSlice[],   // Fragments describing what will happen
  timeframe: PostSlice[],  // Fragments describing when
  llmConfidence: decimal,  // Filter's confidence (0-1)
  vagueness: decimal,      // How vague the prediction is (0-1)
  topicId: uuid,
  context: jsonb,
  filterAgentId: ss58Address
}
```

### PostSlice Structure

PostSlices are references to specific character ranges in tweets:

```typescript
{
  source: { tweet_id: string },
  start: number,  // Character index start
  end: number     // Character index end (exclusive)
}
```

**Key Insight**: Goals and timeframes are arrays of slices because predictions can be fragmented across tweets or have noise between relevant parts.

**Example 1 - Simple Prediction:**
Tweet: "BTC will hit 100k by end of Q1 2025"

- Goal: `[{ source: {tweet_id: "123"}, start: 0, end: 19 }]` → "BTC will hit 100k"
- Timeframe: `[{ source: {tweet_id: "123"}, start: 23, end: 37 }]` → "end of Q1 2025"

**Example 2 - Cross-Tweet Prediction:**
Tweet A (untracked): "BTC will hit 100k"
Tweet B (tracked, replies to A): "It will happen by end of Q1 2025"

- Goal: `[{ source: {tweet_id: "A"}, start: 0, end: 17 }]` → "BTC will hit 100k"
- Timeframe: `[{ source: {tweet_id: "B"}, start: 16, end: 36 }]` → "by end of Q1 2025"

**Example 3 - Noisy Prediction:**
Tweet: "BTC will definitely (I'm not a financial advisor but) hit 100k this year"

- Goal: `[{ source: {tweet_id: "123"}, start: 0, end: 3 }, { source: {tweet_id: "123"}, start: 53, end: 66 }]` → "BTC" + "hit 100k"
- Timeframe: `[{ source: {tweet_id: "123"}, start: 67, end: 76 }]` → "this year"

## Verifier Core Operations

### Stage 1: Maturity Check

Determines if a prediction is ready to be evaluated.

**Ready Conditions:**

- Timeframe end date is in the past (prediction window closed)
- Minimum time elapsed (avoid premature evaluation)
- Not already verified

**Deferred Conditions:**

- Timeframe is in the future
- Open-ended timeframes without clear deadline
- Vague timeframes ("soon", "eventually")

**Skip Conditions:**

- Extremely vague (vagueness > threshold)
- Very low filter confidence (llmConfidence < threshold)
- Missing critical data (no tweets found for slices)

**Implementation Challenge**: Parsing timeframe text to extract actual dates requires NLP or heuristics. Consider using the filter's context field if it includes structured timeframe data.

### Stage 2: Data Integrity Validation

Ensures the parsed prediction data is coherent and accessible.

**Validation Steps:**

1. **Slice Resolution**: Verify all PostSlices reference existing tweets in scraped_tweet table
2. **Index Bounds**: Confirm start/end indices are within tweet text length
3. **Text Extraction**: Pull actual text from each slice
4. **Assembly Test**: Concatenate slices and check for basic coherence
5. **Context Availability**: Ensure thread context is available if cross-tweet references exist

**Failure Modes:**

- Tweet deleted or unavailable
- Invalid indices (filter bug or encoding issues)
- Gibberish text (filter extracted wrong ranges)
- Broken cross-references (referenced tweet not scraped)

**Recovery:**

- Log validation failures with specific error types
- Mark prediction as unverifiable with reason
- Feed failure data back to filter for training/improvement

### Stage 3: Prediction Assembly

Reconstructs the full prediction from fragments for LLM consumption.

**Assembly Process:**

1. **Fetch Tweets**: Get all tweets referenced in goal and timeframe slices
2. **Extract Fragments**: Pull text from each slice using start/end indices
3. **Join Goal**: Concatenate goal slices with separator (space or marker)
4. **Join Timeframe**: Concatenate timeframe slices
5. **Build Context**: If cross-tweet prediction, include parent tweet content
6. **Format Prediction**: Create structured representation for verification

**Output Format:**

```json
{
  "prediction_text": "BTC will hit 100k by end of Q1 2025",
  "goal": "BTC will hit 100k",
  "timeframe": "by end of Q1 2025",
  "topic": "Cryptocurrency Price",
  "source_tweets": [
    { "id": "123", "text": "...", "author": "...", "date": "..." }
  ],
  "context_tweets": [
    { "id": "122", "text": "...", "author": "...", "date": "..." }
  ],
  "filter_confidence": 0.89,
  "vagueness": 0.15
}
```

### Stage 4: Context Gathering

Collects additional information needed for verification.

**Context Sources:**

1. **Thread Context**: Full conversation if prediction references other tweets
2. **Author History**: Recent predictions from same user (for calibration)
3. **Topic Context**: Related predictions on same topic (market trends)
4. **Temporal Context**: Events happening around timeframe dates

**Context Limits:**

- Max thread depth (don't pull entire 1000-tweet threads)
- Max historical predictions per user (recent N only)
- Token budget for LLM context window

### Stage 5: Web Search

Gathers evidence to determine prediction outcome.

**Search Strategy:**

1. **Query Construction**:
   - Extract key entities (BTC, 100k, Q1 2025)
   - Generate search queries ("BTC price Q1 2025", "Bitcoin 100000 March 2025")
   - Include timeframe constraints in search

2. **Search Execution**:
   - Multiple search queries for coverage
   - Prioritize authoritative sources
   - Historical data for past timeframes
   - Market data APIs when available

3. **Result Filtering**:
   - Relevance scoring
   - Date filtering (only sources from timeframe period or after)
   - Source credibility weighting

4. **Evidence Extraction**:
   - Pull key facts supporting or refuting prediction
   - Timestamp evidence
   - Quantitative data when possible

**Cost Management:**

- Cache search results (predictions often overlap)
- Batch similar predictions (same topic/timeframe)
- Rate limiting on search API

### Stage 6: Verdict Generation

Uses an advanced LLM to determine prediction truth value.

**LLM Prompt Structure:**

```
You are evaluating whether a prediction made on Twitter came true.

PREDICTION:
- Text: "BTC will hit 100k by end of Q1 2025"
- Goal: BTC will hit 100k
- Timeframe: by end of Q1 2025
- Made on: 2024-11-15
- Author: @crypto_analyst

EVIDENCE:
[Web search results and market data]

TASK:
Determine if this prediction was TRUE, FALSE, or INDETERMINATE.

- TRUE: Goal clearly achieved within timeframe
- FALSE: Goal clearly not achieved within timeframe
- INDETERMINATE: Ambiguous, insufficient evidence, or edge case

Provide:
1. Verdict (TRUE/FALSE/INDETERMINATE)
2. Confidence (0-1)
3. Reasoning (concise explanation)
4. Key evidence supporting verdict
```

**Verdict Schema:**

```typescript
{
  verdict: "TRUE" | "FALSE" | "INDETERMINATE",
  confidence: number,  // 0-1
  reasoning: string,
  evidence_summary: string[],
  sources: string[]
}
```

**Edge Cases:**

- Vague goals: "BTC will pump" (when is it considered "pumped"?)
- Partial achievement: "BTC will hit 100k" but only reached 99k
- Timeframe ambiguity: "by end of Q1" (last day? last week?)
- Multiple interpretations: Goal could mean different things
- Missing data: No reliable source for ground truth

**LLM Selection:**

- GPT-4 or Claude Opus for complex predictions
- Cheaper models for straightforward binary outcomes
- Cost vs accuracy tradeoff

### Stage 7: Storage and Feedback

Saves verdict and updates related records.

**Storage Operations:**

1. **Insert Verdict**: Save to verdict_schema
2. **Update Prediction**: Mark as verified
3. **Update User Stats**: Aggregate accuracy metrics
4. **Cache Evidence**: Store search results for reuse
5. **Log Costs**: Track API usage (LLM + search)

**Feedback Loops:**

- Low confidence verdicts → flag for human review
- Validation failures → train filter to improve
- Verdict patterns → improve search and prompt strategies

## Architecture Design

### Job Queue System

Similar to scraper, use database-backed job queue with work-stealing pattern.

**Job Table Schema:**

```sql
CREATE TABLE verification_jobs (
  id uuid PRIMARY KEY,
  parsed_prediction_id uuid NOT NULL,
  stage verification_stage NOT NULL,
  priority integer NOT NULL,
  attempts integer DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL,
  updated_at timestampz NOT NULL,
  locked_until timestamptz
);

CREATE TYPE verification_stage AS ENUM (
  'maturity_check',
  'data_validation',
  'assembly',
  'context_gathering',
  'web_search',
  'verdict_generation'
);
```

**Job State Machine:**

```
maturity_check → [skip if not ready]
      ↓
data_validation → [skip if invalid]
      ↓
assembly → [skip if assembly fails]
      ↓
context_gathering
      ↓
web_search
      ↓
verdict_generation → DONE
```

**Worker Pattern:**

```typescript
while (!stopped) {
  const job = await getNextJob(); // FOR UPDATE SKIP LOCKED

  switch (job.stage) {
    case "maturity_check":
      if (await isMature(job)) {
        await advanceStage(job, "data_validation");
      } else {
        await defer(job, calculateWaitTime(job));
      }
      break;

    case "data_validation":
      const validation = await validateData(job);
      if (validation.valid) {
        await advanceStage(job, "assembly");
      } else {
        await markUnverifiable(job, validation.reason);
      }
      break;

    // ... other stages
  }
}
```

### Concurrency and Batching

**Concurrent Workers:**

- Multiple workers process different stages in parallel
- FOR UPDATE SKIP LOCKED prevents conflicts
- Each stage is idempotent

**Batch Opportunities:**

1. **Web Search Batching**: Group predictions with similar queries
2. **LLM Batching**: Send multiple simple verdicts in one prompt
3. **Context Fetching**: Batch tweet lookups

### Cost Management

**Budget Tracking:**

```sql
CREATE TABLE verification_costs (
  job_id uuid PRIMARY KEY,
  web_search_cost decimal,
  llm_cost decimal,
  total_cost decimal,
  timestamp timestamptz
);
```

**Cost Optimization:**

1. **Priority Scoring**: Verify high-value predictions first
   - High filter confidence + low vagueness = high priority
   - Popular topics = higher value
   - Influential users = higher value

2. **Deferral Strategies**:
   - Skip very vague predictions
   - Defer low-confidence predictions
   - Batch process cheap predictions

3. **Cache Aggressively**:
   - Search results keyed by query + timeframe
   - Common entity data (BTC price on date X)
   - Verdict patterns for similar predictions

### Error Handling

**Retry Logic:**

- Transient failures: exponential backoff
- Rate limits: respect retry-after headers
- Invalid data: mark as unverifiable, don't retry

**Failure Categories:**

1. **Recoverable**: Network errors, rate limits, temporary API issues
2. **Unrecoverable**: Invalid data, missing tweets, deleted content
3. **Ambiguous**: Unclear if prediction can be evaluated

## Better Use of Predictions

### User Reputation System

**Accuracy Tracking:**

```sql
CREATE TABLE user_prediction_stats (
  user_id bigint PRIMARY KEY,
  total_predictions integer,
  verified_predictions integer,
  true_predictions integer,
  false_predictions integer,
  indeterminate_predictions integer,
  accuracy_rate decimal,  -- true / (true + false)
  calibration_score decimal,  -- How well confidence matches outcomes
  last_updated timestamptz
);
```

**Calibration Analysis:**

- Do high-confidence predictions actually come true more often?
- Are certain users consistently overconfident or underconfident?
- Topic-specific accuracy (good at crypto, bad at politics)

**Reputation Score Calculation:**

```
reputation = (
  accuracy_rate * 0.5 +
  calibration_score * 0.3 +
  volume_factor * 0.2
) * recency_weight
```

### Topic Intelligence

**Aggregated Insights:**

1. **Consensus Detection**: When many users predict the same outcome
2. **Contrarian Signals**: High-reputation users going against consensus
3. **Accuracy by Topic**: Which topics have more accurate predictions
4. **Timeframe Patterns**: Short-term vs long-term accuracy

**Market Intelligence:**

- Early detection of trends (cluster of similar predictions)
- Sentiment tracking (bullish vs bearish on topics)
- Event impact analysis (accuracy before/after major events)

### Prediction Markets Integration

**Potential Applications:**

1. **Liquidity Provision**: Use prediction accuracy to weight market maker positions
2. **Signal Generation**: High-reputation predictions as trading signals
3. **Market Validation**: Compare prediction accuracy vs market prices
4. **Arbitrage Detection**: Predictions inconsistent with market odds

### Alert Systems

**High-Value Prediction Alerts:**

Trigger alerts when:

- High-reputation user makes confident prediction
- Cluster of similar predictions from multiple users
- Contrarian prediction from accurate user
- Significant consensus shift on topic

**Alert Channels:**

- Discord/Telegram notifications
- Email digests
- API webhooks for integrations

### Prediction Analytics Dashboard

**Metrics to Track:**

- Overall accuracy by user, topic, timeframe
- Calibration curves
- Prediction volume over time
- Topic trends
- Most accurate predictors leaderboard
- Worst predictions (for entertainment/learning)

**Visualization Ideas:**

- Accuracy heatmap by user and topic
- Confidence vs outcome scatter plots
- Timeline of prediction volume and accuracy
- Topic correlation matrix

### Training Data for AI

**Prediction as Dataset:**

Verified predictions with outcomes create valuable training data:

1. **Filter Improvement**: Feed validation failures back to train better filters
2. **Verdict Calibration**: Use human-verified verdicts to calibrate LLM
3. **Feature Engineering**: Learn which prediction characteristics matter
4. **New Model Training**: Build custom models for prediction classification

### On-Chain Integration

**Blockchain Use Cases:**

1. **Immutable Record**: Store verdict proofs on-chain
2. **Reputation NFTs**: User accuracy scores as NFTs
3. **Prediction Tokens**: Tokenize verified predictions
4. **Staking on Accuracy**: Users stake on their own prediction quality

## Implementation Priorities

### Phase 1: Core Pipeline (MVP)

1. Maturity checker
2. Data validation
3. Simple assembly (single-tweet predictions only)
4. Basic web search
5. LLM verdict generation
6. Storage and basic stats

### Phase 2: Optimization

1. Cross-tweet assembly
2. Batch processing
3. Cost management
4. Caching layer
5. Error recovery

### Phase 3: Intelligence

1. User reputation system
2. Topic aggregation
3. Alert system
4. Analytics dashboard

### Phase 4: Advanced Features

1. Prediction markets integration
2. On-chain components
3. Advanced ML models
4. Real-time processing

## Open Questions

1. **Timeframe Parsing**: Use LLM to extract structured dates or heuristic parsing?
2. **Ground Truth Sources**: Which APIs/sources are most reliable per topic?
3. **Verdict Ambiguity**: What percentage threshold for TRUE vs INDETERMINATE?
4. **Cost Budget**: What's acceptable cost per verification?
5. **Human Review**: Which verdicts need human validation?
6. **Feedback Loop**: How to use verdict data to improve filter?
7. **Real-time vs Batch**: Should verifier run continuously or scheduled?
8. **Multi-LLM**: Use different LLMs for different prediction types?

## Success Metrics

- **Throughput**: Predictions verified per day
- **Accuracy**: Human agreement with verdicts (sample validation)
- **Cost Efficiency**: Average cost per verification
- **Coverage**: Percentage of predictions successfully verified
- **Latency**: Time from prediction mature to verdict
- **User Value**: Reputation score correlation with actual predictive power

## Critical Complexities and Unknown Unknowns

### Prediction Semantics (MVP Considerations)

While our initial implementation assumes simple "X will happen by Y date" predictions, we need to be aware of semantic complexities that will emerge:

**Initial Scope (MVP):**

- Focus on single-condition price predictions (BTC hits 100k)
- Simple timeframe deadlines (by date X)
- Binary outcomes (reached or not reached)

**Complexities to Track (for future iterations):**

- **Conditional predictions**: "BTC hits 100k if ETF approved" - currently mark as INDETERMINATE
- **Compound predictions**: "BTC to 100k AND ETH to 10k" - currently evaluate only first condition
- **Range predictions**: "BTC between 90k-110k" - treat upper bound as target for MVP
- **Sustained vs touched**: "BTC at 100k" - MVP assumes any touch counts as success

### Temporal Precision Challenges

Timeframe extraction is more nuanced than simple date parsing. The initial approach must handle ambiguity gracefully.

**MVP Approach:**

- Use structured LLM extraction for timeframes (more reliable than regex patterns)
- Default to end-of-day UTC for ambiguous times
- Track timeframe extraction confidence in context field

**LLM Timeframe Extraction Strategy:**

```typescript
// Instead of regex, use LLM with structured output for robust parsing
interface TimeframeExtractionPrompt {
  instruction: "Extract the timeframe from this prediction text and return structured data";
  prediction_text: string;
  current_date: string;

  expected_output: {
    start_date?: string; // ISO format
    end_date: string; // ISO format, required
    precision: "hour" | "day" | "week" | "month" | "quarter";
    confidence: number; // 0-1
    ambiguity_notes?: string; // "assumed EOD UTC", "fiscal vs calendar quarter unclear"
  };
}
```

This approach is more robust than regex because:

1. LLMs understand context ("next Friday" vs "this Friday")
2. Handle relative dates ("in 3 months", "by year end")
3. Resolve ambiguous references ("Q1" - fiscal or calendar?)
4. Provide confidence scores for uncertain extractions

### Ground Truth Reliability

**MVP Approach:**

- Use single authoritative source per asset class (CoinGecko for crypto)
- Document source in verdict for transparency
- Flag edge cases but don't over-engineer

**Known Issues to Document:**

- Exchange price discrepancies (use volume-weighted average when possible)
- Wick vs body for technical predictions (default to high/low for "touch" events)
- Data gaps or outages (mark as INDETERMINATE if missing critical data)

## Cost Optimization for MVP

### Smart Context Schema Usage

Expand the filter's context_schema to reduce LLM verification costs:

```typescript
interface EnhancedContextSchema {
  // Have the filter extract these during initial parsing
  entities: {
    tickers?: string[]; // ["BTC", "ETH"]
    target_prices?: number[]; // [100000, 10000]
    comparison?: "above" | "below" | "between";
  };

  // Helps determine verification strategy
  complexity_hint: "simple_price" | "complex" | "event_based";

  // For initial MVP, just flag if special handling needed
  requires_llm_verification: boolean;
}
```

### Batching Strategy for MVP

Start simple but design for future batching:

```typescript
// MVP: Process individually but structure for future batching
interface VerificationBatch {
  predictions: ParsedPrediction[];
  shared_context: {
    ticker?: string;
    timeframe_end?: Date;
    data_source?: string;
  };

  // MVP: Set batch_size = 1
  // Future: Group similar predictions
  batch_size: number;
}
```

### Progressive Cost Reduction

**Phase 1 (MVP):**

- Every verification uses LLM but with optimized prompts
- Cache search results aggressively
- Skip obviously unverifiable predictions

**Phase 2:**

- Simple price checks bypass LLM if context_schema has clean data
- Batch similar predictions in single LLM call

**Phase 3:**

- Introduce lightweight models for simple cases
- Reserve expensive LLMs for complex predictions only

## Edge Cases for MVP

Document these but implement simple handling initially:

```typescript
enum MVPEdgeCases {
  // Handle in MVP
  DELETED_TWEET = "mark as INDETERMINATE",
  NO_DATA = "mark as INDETERMINATE",
  VAGUE_TIMEFRAME = "skip verification",

  // Document but punt to v2
  FLASH_WICK = "treat as success for now",
  EXCHANGE_DIFF = "use primary source only",
  MODIFIED_PREDICTION = "use original only",
}
```

## Future Improvements (Post-MVP)

### Verification Tiers System

Once MVP is working, implement a multi-tier approach to reduce costs:

**Tier 1 - Deterministic (Future)**

- Rule-based verification for simple numeric targets
- Direct API checks for price predictions
- No LLM needed for clear-cut cases

**Tier 2 - Lightweight Models (Future)**

- Specialized small models for timeframe extraction
- Classification models for prediction types
- Lower cost than GPT-4/Claude

**Tier 3 - Advanced LLM (Current MVP approach)**

- Complex semantic understanding
- Ambiguous cases
- Multiple condition evaluation

### Verification Confidence Framework (Future)

After MVP, add confidence scoring to handle uncertainty better:

```typescript
interface FutureConfidenceModel {
  data_quality: number; // How good is our ground truth?
  semantic_clarity: number; // How clear was the prediction?
  temporal_precision: number; // How precise was timing?

  // Use this to determine if human review needed
  requires_human_review: boolean;
}
```

### Advanced Timeframe Parsing (Future)

While MVP uses LLM extraction, future versions could combine approaches:

1. Try deterministic parsing first (for common patterns)
2. Fall back to lightweight NLP models
3. Use expensive LLM only for complex cases

## Implementation Checklist for MVP

1. **Start with LLM-based timeframe extraction** - more robust than regex, good enough for MVP
2. **Enhance context_schema** in filter - extract tickers and prices to enable future optimizations
3. **Single data source per asset type** - avoid complexity of multiple sources initially
4. **Mark edge cases as INDETERMINATE** - don't over-engineer solutions yet
5. **Cache aggressively** - search results, API data, even LLM responses for identical predictions
6. **Track cost per verification** - measure to optimize later
7. **Log everything** - prediction complexity, timeframe ambiguity, data issues for analysis

## Monitoring and Iteration

Track these metrics to guide post-MVP improvements:

- Which predictions require most expensive verification?
- What percentage could skip LLM with better context extraction?
- Common timeframe patterns that could be extracted deterministically
- Failure modes and their frequency
- Cost distribution across prediction types

## API Strategy and Data Sources

### The Hidden Complexity of Crypto Price APIs

Most crypto APIs have limitations that affect verification accuracy:

**Rate Limits and Costs:**

- CoinGecko: 10-30 calls/min (free tier), historical data limited
- Binance: 1200 requests/min but no aggregated historical OHLCV beyond 1000 candles
- CryptoCompare: Good historical data but expensive for high volume

**Data Quality Issues:**

- **Retroactive corrections**: Some APIs adjust historical data after the fact
- **Missing granularity**: Daily candles might miss intraday spikes
- **Exchange-specific vs aggregated**: Single exchange data can be misleading

**MVP Strategy:**

```typescript
interface DataSourceStrategy {
  primary: {
    crypto: "coingecko"; // Good balance of cost and coverage
    stocks: "yahoo_finance";
    forex: "exchangerate_api";
  };

  fallback: {
    crypto: "binance_api"; // If CoinGecko fails
    stocks: "alpha_vantage";
  };

  // Critical: Store raw response for audit trail
  storage: {
    raw_api_response: boolean; // Always true
    timestamp: Date;
    source: string;
    version: string; // API version for future debugging
  };
}
```

### Caching Strategy for Cost Reduction

Aggressive caching is essential for managing API costs:

```typescript
interface CacheStrategy {
  // Level 1: Exact prediction cache
  prediction_cache: {
    key: hash(goal + timeframe + ticker);
    ttl: 'permanent'; // Never expires once verified
    value: Verdict;
  };

  // Level 2: Price data cache
  price_cache: {
    key: `${ticker}_${date}_${exchange}`;
    ttl: 24 * 60 * 60; // 1 day for recent, permanent for old
    value: OHLCV;
  };

  // Level 3: LLM response cache
  llm_cache: {
    key: hash(prompt + model);
    ttl: 7 * 24 * 60 * 60; // 1 week
    value: ParsedResponse;
  };

  // Level 4: Search result cache
  search_cache: {
    key: hash(query + date_range);
    ttl: 3 * 24 * 60 * 60; // 3 days
    value: SearchResults;
  };
}
```

**Cache Warming Strategy:**

- Pre-fetch popular ticker prices daily
- Cache common date calculations (end of month, quarter ends)
- Store parsed timeframes for reuse

## Verification State Machine Considerations

### State Transitions and Failure Modes

The verification state machine has more complexity than it appears:

```typescript
interface VerificationStates {
  // Initial states
  PENDING: "waiting for maturity";
  READY: "timeframe ended, ready to verify";

  // Processing states
  VALIDATING: "checking data integrity";
  ASSEMBLING: "building prediction text";
  SEARCHING: "gathering evidence";
  ANALYZING: "LLM processing";

  // Terminal states
  VERIFIED: "successfully verified";
  UNVERIFIABLE: "cannot be verified";
  FAILED: "system error during verification";

  // Special states
  DEFERRED: "waiting for better data";
  DISPUTED: "conflicting evidence found";
  MANUAL_REVIEW: "requires human input";
}

interface StateTransitionRules {
  // Retry logic per state
  VALIDATING: { max_retries: 3; backoff: "exponential" };
  SEARCHING: { max_retries: 5; backoff: "linear" };
  ANALYZING: { max_retries: 2; backoff: "exponential"; cost_limit: 1.0 };

  // Failure escalation
  on_max_retries: "UNVERIFIABLE" | "MANUAL_REVIEW";

  // Cost controls
  max_cost_per_prediction: 2.0;
  abort_on_cost_exceeded: true;
}
```

### Handling Concurrent Verifications

Multiple workers need coordination:

```typescript
interface ConcurrencyControl {
  // Prevent double-verification
  locking: {
    mechanism: "database_advisory_lock" | "redis_lock";
    timeout: 300; // 5 minutes max per verification
    identifier: "parsed_prediction_id";
  };

  // Rate limiting per resource
  limits: {
    coingecko_api: 10; // concurrent requests
    llm_api: 5; // expensive, limit parallelism
    web_search: 20; // can be more aggressive
  };

  // Smart scheduling
  priority_queue: {
    high: "low_vagueness + high_confidence + popular_user";
    medium: "default";
    low: "high_vagueness | low_confidence";
  };
}
```

## The Unknown Unknowns You're Missing

### 1. **Prediction Modification Patterns**

Users often clarify or modify predictions in follow-up tweets:

- "To clarify my earlier tweet, I meant calendar Q1 not fiscal"
- "Update: Moving my target to 95k"
- "Still bullish but extending timeline to Q2"

**Impact**: Your PostSlice approach captures the original but might miss critical updates.

**Mitigation**: Track reply chains from the same author within 24-48 hours of original prediction.

### 2. **Timezone and Market Hours Hell**

Crypto trades 24/7 but many predictors think in traditional market terms:

- "By Friday close" - which close? NYSE? London? Tokyo?
- "End of day" - whose day?
- "This weekend" - Saturday 00:00 UTC or Sunday 23:59 poster's timezone?

**Impact**: Could incorrectly mark predictions as false due to timezone misalignment.

**Mitigation**: When ambiguous, check multiple timezone interpretations and document which was used.

### 3. **The Precision Paradox**

Very precise predictions might be easier to verify but less valuable:

- "BTC will hit exactly $100,000.00" vs "BTC will break 100k"
- "SPY will close at 420.69" vs "SPY will be in the 420s"

**Impact**: Your verification might be too strict or too lenient inconsistently.

**Mitigation**: Extract precision intent from language and adjust verification accordingly.

### 4. **Data Source Time Lag**

Different APIs update at different rates:

- Real-time exchange data vs 15-minute delayed aggregators
- End-of-day settlement prices vs continuous trading
- Official close vs after-hours trading

**Impact**: Verification timing affects outcome - checking too early or with wrong source gives wrong verdict.

**Mitigation**: Document data source latency and implement appropriate waiting periods.

### 5. **Context Collapse in Threads**

Your PostSlice elegantly handles fragments, but context can dramatically change meaning:

- Sarcastic predictions that seem serious out of context
- Hypothetical scenarios presented as predictions
- Quote tweets that negate the original

**Impact**: Verifying the wrong thing entirely.

**Mitigation**: The filter needs to pass sentiment and context flags, not just text fragments.

## Practical Cost Management

### The Real Cost Drivers

Based on the architecture, your main costs will be:

1. **LLM API calls** (60-70% of cost)
   - Timeframe extraction: ~$0.01-0.02 per prediction
   - Verdict generation: ~$0.05-0.10 per prediction
   - Total: ~$0.06-0.12 per verification

2. **Web searches** (20-30% of cost)
   - 2-3 searches per prediction: ~$0.02-0.04
   - Can balloon if not cached properly

3. **Data APIs** (10-20% of cost)
   - Usually manageable with free tiers
   - Spikes if you need high-frequency historical data

### Cost Reduction Quick Wins

1. **Implement result deduplication early**: Many predictions are similar or identical
2. **Use the context field aggressively**: Have the filter do more extraction work with cheaper models
3. **Implement a "confidence threshold"**: Skip verifying predictions with filter confidence < 0.5
4. **Time-box expensive operations**: Set max cost per prediction and abort if exceeded
5. **Use webhook triggers instead of polling**: Only verify when predictions mature

### The 80/20 Rule for Verification

Focus initial efforts on the 20% of cases that cover 80% of value:

- High-confidence, low-vagueness predictions
- Popular tickers (BTC, ETH, SPY, TSLA)
- Standard timeframes (end of month, end of quarter)
- Binary outcomes (above/below price X)

Leave edge cases for later iterations rather than over-engineering the MVP.

## Strategic Insights: Making ParsedPrediction Work for You

### The Power of Your PostSlice Architecture

Your PostSlice approach is actually brilliant for several non-obvious reasons:

1. **Audit Trail**: You can always show exactly what text was used for verification
2. **Version Control**: If tweet text changes (rare but possible), you have the original indices
3. **Context Preservation**: You maintain the relationship between fragments
4. **Legal Protection**: You can prove you didn't misinterpret or modify the prediction

### The Context Field is Your Secret Weapon

The `context` jsonb field in ParsedPrediction is underutilized. Use it to store:

```typescript
interface RichContext {
  // Structured extraction (have filter do this)
  extracted_entities: {
    tickers: string[];
    prices: number[];
    dates: Date[];
    conditions: string[]; // "if ETF approved", "unless fed raises rates"
  };

  // Metadata for verification
  verification_hints: {
    precision_required: "exact" | "approximate" | "directional";
    data_sources_suggested: string[];
    similar_predictions_ids: uuid[]; // For batching
  };

  // Filter's interpretation
  filter_interpretation: {
    prediction_type: string;
    confidence_breakdown: {
      timeframe_clarity: number;
      goal_clarity: number;
      overall: number;
    };
    ambiguity_flags: string[];
  };

  // Thread context
  thread_metadata: {
    is_reply: boolean;
    has_clarifications: boolean;
    sentiment: "serious" | "joking" | "hypothetical";
  };
}
```

### The LLM Arbitrage Opportunity

Different LLMs have different strengths and costs. Use them strategically:

1. **GPT-3.5 / Claude Haiku**: Timeframe extraction, simple classifications
2. **GPT-4 Mini**: Standard verdict generation for clear predictions
3. **GPT-4 / Claude**: Complex multi-condition predictions, ambiguous cases
4. **Local LLMs**: Batch processing of simple binary checks (if you have GPU)

### The Verification Certainty Spectrum

Not all verdicts are binary. Design for nuance:

```typescript
enum VerdictCertainty {
  DEFINITELY_TRUE = 1.0, // Hit exact price on exact date
  PROBABLY_TRUE = 0.8, // Hit price within reasonable margin
  LIKELY_TRUE = 0.6, // Directionally correct, close to target
  UNCERTAIN = 0.5, // Ambiguous evidence
  LIKELY_FALSE = 0.4, // Missed target but was close
  PROBABLY_FALSE = 0.2, // Clearly missed target
  DEFINITELY_FALSE = 0.0, // Opposite of prediction occurred
}
```

This granularity helps with:

- User reputation scoring (partial credit for "almost right")
- Identifying systematic biases (always too optimistic on timeline)
- Learning which predictions are hardest to verify

### The Feedback Loop You're Not Considering

Your system generates valuable data for improving itself:

```typescript
interface SystemLearning {
  // Which users make verifiable predictions?
  user_verifiability_score: number;

  // Which topics have reliable data sources?
  topic_data_availability: Map<string, number>;

  // Which timeframe phrases are problematic?
  problematic_phrases: Set<string>;

  // Cost per topic/user/complexity
  cost_model: {
    by_topic: Map<string, number>;
    by_complexity: Map<string, number>;
    by_user_quality: Map<string, number>;
  };
}
```

Use this to:

- Prioritize high-value, low-cost verifications
- Coach users toward more verifiable prediction formats
- Identify which filters are extracting poor-quality predictions

### The Critical Decision: Synchronous vs Asynchronous Verification

You have a fundamental architectural choice:

**Synchronous (Immediate):**

- Verify as soon as timeframe ends
- Higher costs (can't batch effectively)
- Better user experience (quick feedback)
- Simpler architecture

**Asynchronous (Batched):**

- Verify in daily/weekly batches
- Lower costs (better batching, caching)
- Delayed user feedback
- More complex but more scalable

**Hybrid Approach (Recommended):**

- Immediate verification for high-value predictions
- Batch verification for everything else
- Cost-based routing (expensive predictions wait for batch)

### The Most Important Thing: Start Simple, Measure Everything

Your MVP should:

1. **Handle only single-condition price predictions** initially
2. **Use one LLM for everything** (optimize later)
3. **Cache aggressively** from day one
4. **Log every decision** for analysis
5. **Set a cost ceiling** per prediction ($0.50 max initially)
6. **Mark anything ambiguous as INDETERMINATE** rather than guess

Then measure:

- What percentage of predictions are actually verifiable?
- What's the real cost distribution?
- Which edge cases happen most frequently?
- Where does the LLM struggle most?

This data drives your iteration priorities.

## Summary: The Path Forward

1. **Week 1-2**: Build basic pipeline with LLM-based timeframe extraction and verdict generation
2. **Week 3-4**: Add caching layers and basic cost controls
3. **Month 2**: Implement batching and optimize based on real data
4. **Month 3**: Add specialized handlers for common patterns
5. **Future**: Multi-tier verification system with deterministic fast path

Remember: Your PostSlice + context architecture is more powerful than it might seem. The key is using the filter to extract as much structured data as possible into the context field, reducing the burden on expensive verification LLMs. Focus on the 80% of simple cases first, and let edge cases teach you what to build next.
