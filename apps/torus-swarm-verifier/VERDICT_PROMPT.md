# Verdict Generation Prompt

## Goal

Determine if a prediction came true by searching for evidence and checking if the goal was achieved within the specified timeframe.

**CRITICAL: This must be a PREDICTION, not NEWS reporting.** If the goal was already true or was news BEFORE the prediction was made (before start_utc), the prediction is INVALID and must return verdict: false.

## Inputs

You will receive:

```json
{
  "context": "Author is making a confident price prediction for Bitcoin reaching 100k by end of Q1 2025.",
  "goal_text": "BTC will hit 100k",
  "timeframe_text": "by end of Q1 2025",
  "timeframe_parsed": {
    "start_utc": "2024-11-15T12:00:00Z",
    "end_utc": "2025-03-31T23:59:59Z",
    "precision": "quarter"
  }
}
```

## Task

Search the web for evidence and determine if the goal was achieved within the timeframe.

**Critical Instructions:**

1. **Check if this was NEWS, not a prediction:**
   - Search for evidence that the goal was ALREADY TRUE before start_utc
   - If the goal was achieved, announced, or reported BEFORE the prediction was made, verdict MUST be false
   - Example: Tweet says "BTC will hit 100k by March" on Jan 15, but BTC already hit 100k on Jan 10
   - This disqualifies the "prediction" as it's just reporting existing news

2. **Only evaluate predictions that were actually predictive:**
   - ONLY consider evidence from dates between start_utc and end_utc
   - Ignore any evidence from after end_utc (too late)
   - For price predictions: Target reached at ANY point during the window counts as true
   - If you cannot find sufficient evidence, verdict is false

3. **Search authoritative sources:**
   - Use reliable sources for verification (news sites, official announcements, market data)
   - Cite specific sources and dates in your reasoning

## Output Format

Return ONLY valid JSON (no markdown fences):

```json
{
  "valid": true,
  "verdict": true,
  "confidence": 0.95,
  "reasoning": "Brief explanation of why the prediction came true or false, citing specific sources and dates"
}
```

**Fields:**

- `valid`: Boolean indicating if this was a legitimate prediction (true) or invalid/news (false)
- `verdict`: Boolean indicating if the prediction came true (true) or false (false). Only meaningful when valid=true.
- `confidence`: Confidence score from 0.0 to 1.0 indicating certainty in the verdict determination
- `reasoning`: Explanation with sources and dates

**When to set valid=false:**

- Goal was already achieved/announced BEFORE start_utc (this was news, not a prediction)
- When valid=false, verdict should also be false

## Examples

### Example 1: True

**Input:**

```json
{
  "context": "Price prediction for Bitcoin.",
  "goal_text": "BTC will hit 100k",
  "timeframe_text": "by end of Q1 2025",
  "timeframe_parsed": {
    "start_utc": "2024-11-15T12:00:00Z",
    "end_utc": "2025-03-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": true,
  "verdict": true,
  "confidence": 0.98,
  "reasoning": "According to CoinGecko, Bitcoin reached $102,450 on March 28, 2025, which is within the timeframe and exceeds the $100k target."
}
```

### Example 2: False

**Input:**

```json
{
  "context": "Price prediction for Bitcoin.",
  "goal_text": "BTC will hit 100k",
  "timeframe_text": "by end of Q1 2025",
  "timeframe_parsed": {
    "start_utc": "2024-11-15T12:00:00Z",
    "end_utc": "2025-03-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": true,
  "verdict": false,
  "confidence": 0.95,
  "reasoning": "Bitcoin peaked at $87,300 on March 31, 2025 according to market data, falling short of the $100k target."
}
```

### Example 3: False - Happened After Deadline

**Input:**

```json
{
  "context": "Price prediction for Bitcoin.",
  "goal_text": "BTC will hit 100k",
  "timeframe_text": "by end of Q1 2025",
  "timeframe_parsed": {
    "start_utc": "2024-11-15T12:00:00Z",
    "end_utc": "2025-03-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": true,
  "verdict": false,
  "confidence": 0.97,
  "reasoning": "Bitcoin reached $102,000 on April 3, 2025, which is after the deadline of March 31, 2025. The prediction failed."
}
```

### Example 4: False - No Evidence

**Input:**

```json
{
  "context": "Price prediction for an obscure token.",
  "goal_text": "XYZ will hit $10",
  "timeframe_text": "by Friday",
  "timeframe_parsed": {
    "start_utc": "2025-01-20T00:00:00Z",
    "end_utc": "2025-01-24T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": true,
  "verdict": false,
  "confidence": 0.7,
  "reasoning": "Unable to find reliable price data for XYZ token during the specified timeframe. Insufficient evidence to verify the prediction."
}
```

### Example 5: Invalid - This Was News, Not a Prediction

**Input:**

```json
{
  "context": "Author claiming Bitcoin will hit 100k by end of month.",
  "goal_text": "BTC will hit 100k",
  "timeframe_text": "by end of January",
  "timeframe_parsed": {
    "start_utc": "2025-01-15T10:30:00Z",
    "end_utc": "2025-01-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": false,
  "verdict": false,
  "confidence": 0.99,
  "reasoning": "Bitcoin reached $100,000 on January 12, 2025 according to CoinGecko, which is BEFORE the prediction was made on January 15, 2025. This is not a prediction but rather news reporting or commentary on an event that already happened. Prediction is invalid."
}
```

### Example 6: Invalid - Event Already Announced Before Prediction

**Input:**

```json
{
  "context": "Author predicting a major company acquisition.",
  "goal_text": "Microsoft will acquire OpenAI",
  "timeframe_text": "by end of Q1",
  "timeframe_parsed": {
    "start_utc": "2025-02-10T14:00:00Z",
    "end_utc": "2025-03-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": false,
  "verdict": false,
  "confidence": 0.98,
  "reasoning": "Microsoft announced the acquisition of OpenAI on February 8, 2025 according to Reuters and Bloomberg. The tweet was made on February 10, 2025, which is AFTER the announcement. This is news commentary, not a prediction. Prediction is invalid."
}
```

### Example 7: Valid - Actual Prediction That Came True

**Input:**

```json
{
  "context": "Author predicting Ethereum price movement.",
  "goal_text": "ETH will reach $5000",
  "timeframe_text": "by March 2025",
  "timeframe_parsed": {
    "start_utc": "2024-12-01T08:00:00Z",
    "end_utc": "2025-03-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": true,
  "verdict": true,
  "confidence": 0.96,
  "reasoning": "Verified that ETH was trading at $3,200 when the prediction was made on December 1, 2024. ETH reached $5,100 on March 15, 2025 according to CoinGecko, which is within the timeframe. This was a genuine forward-looking prediction that came true."
}
```
