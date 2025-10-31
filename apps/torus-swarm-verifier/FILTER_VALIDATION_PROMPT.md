# Filter Extraction Validation Prompt

## Goal

Summarize the thread context and determine if the extracted slices represent a valid prediction.

## Inputs

You will receive:

```json
{
  "current_date": "2025-01-20T00:00:00Z",
  "thread_tweets": [
    {
      "tweet_id": "123456789",
      "author": "@username",
      "date": "2025-01-15T14:30:00Z",
      "text": "Full tweet text here"
    }
  ],
  "goal_slices": [
    {
      "tweet_id": "123456789",
      "start": 0,
      "end": 20,
      "text": "BTC will hit 100k"
    }
  ],
  "timeframe_slices": [
    {
      "tweet_id": "123456789",
      "start": 21,
      "end": 35,
      "text": "by end of Q1"
    }
  ],
  "timeframe_parsed": {
    "start_utc": "2025-01-15T14:30:00Z",
    "end_utc": "2025-03-31T23:59:59Z",
    "precision": "quarter"
  }
}
```

## Task

Determine if this is a valid prediction that should be verified.

**Check for disqualifying factors:**

- Negation: "I don't think", "won't", "unlikely"
- Sarcasm: "lol", "lmao", emojis, "yeah right"
- Conditionals: "if X happens", "assuming Y"
- Quoting others: Author quoting someone else's view
- Heavy hedging: "maybe", "possibly", "could"
- Future timeframe: Prediction end_utc is AFTER current_date (not yet mature for verification)

## Output Format

Return ONLY valid JSON (no markdown fences):

```json
{
  "context": "Brief summary of what the thread is about and what the author was saying",
  "is_valid": true | false,
  "failure_cause": "negation" | "sarcasm" | "conditional" | "quoting_others" | "heavy_hedging" | "future_timeframe" | "other" | null,
  "confidence": 0.95,
  "reasoning": "Explanation of why this is or isn't a valid prediction"
}
```

**Fields:**

- `context`: Brief summary of the thread and what the author was saying
- `is_valid`: Boolean indicating if this is a valid prediction
- `failure_cause`: Category of failure (null if is_valid is true). Must be one of:
  - `"negation"`: Prediction is negated ("I don't think", "won't", "unlikely")
  - `"sarcasm"`: Sarcastic or joking tone ("lol", "lmao", emojis)
  - `"conditional"`: Conditional prediction ("if X happens", "assuming Y")
  - `"quoting_others"`: Author is quoting someone else's view
  - `"heavy_hedging"`: Heavily hedged ("maybe", "possibly", "could")
  - `"future_timeframe"`: Prediction hasn't matured yet (end_utc > current_date)
  - `"other"`: Other disqualifying factors not covered above
- `confidence`: Confidence score from 0.0 to 1.0 indicating how certain the validation is
- `reasoning`: Human-readable explanation

## Examples

### Example 1: Valid

**Input:**

```json
{
  "current_date": "2025-04-15T00:00:00Z",
  "thread_tweets": [
    {
      "text": "I'm calling it now: BTC will hit 100k by end of Q1 2025. Screenshot this."
    }
  ],
  "goal_slices": [{ "text": "BTC will hit 100k" }],
  "timeframe_slices": [{ "text": "by end of Q1 2025" }],
  "timeframe_parsed": {
    "start_utc": "2025-01-15T14:30:00Z",
    "end_utc": "2025-03-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "Author is making a confident price prediction for Bitcoin reaching 100k by end of Q1 2025.",
  "is_valid": true,
  "failure_cause": null,
  "confidence": 0.98,
  "reasoning": "Clear, unconditional prediction with specific target and deadline. No hedging, sarcasm, or conditions. Timeframe has passed (ended 2025-03-31), so it's mature for verification."
}
```

### Example 2: Invalid - Negation

**Input:**

```json
{
  "current_date": "2025-04-15T00:00:00Z",
  "thread_tweets": [
    { "text": "I don't think BTC will hit 100k by end of Q1 tbh" }
  ],
  "goal_slices": [{ "text": "BTC will hit 100k" }],
  "timeframe_slices": [{ "text": "by end of Q1" }],
  "timeframe_parsed": {
    "start_utc": "2025-01-15T00:00:00Z",
    "end_utc": "2025-03-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "Author is expressing doubt that Bitcoin will reach 100k by end of Q1. This is a negative prediction.",
  "is_valid": false,
  "failure_cause": "negation",
  "confidence": 0.99,
  "reasoning": "Author explicitly stated 'I don't think' which negates the prediction. The filter removed the negation."
}
```

### Example 3: Invalid - Sarcasm

**Input:**

```json
{
  "current_date": "2025-01-20T00:00:00Z",
  "thread_tweets": [
    { "text": "Yeah BTC will totally hit 100k by next week lmaooo 🤡" }
  ],
  "goal_slices": [{ "text": "BTC will totally hit 100k" }],
  "timeframe_slices": [{ "text": "by next week" }],
  "timeframe_parsed": {
    "start_utc": "2025-01-20T00:00:00Z",
    "end_utc": "2025-01-27T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "Author is sarcastically mocking the idea that Bitcoin could reach 100k in such a short timeframe.",
  "is_valid": false,
  "failure_cause": "sarcasm",
  "confidence": 0.97,
  "reasoning": "Clear sarcasm indicators: 'totally', 'lmaooo', clown emoji, and unrealistic timeframe. This is a joke, not a serious prediction."
}
```

### Example 4: Invalid - Conditional

**Input:**

```json
{
  "current_date": "2025-01-20T00:00:00Z",
  "thread_tweets": [
    { "text": "If the ETF gets approved, BTC will hit 100k by end of year" }
  ],
  "goal_slices": [{ "text": "BTC will hit 100k" }],
  "timeframe_slices": [{ "text": "by end of year" }],
  "timeframe_parsed": {
    "start_utc": "2025-01-20T00:00:00Z",
    "end_utc": "2025-12-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "Author is making a conditional prediction based on ETF approval.",
  "is_valid": false,
  "failure_cause": "conditional",
  "confidence": 0.96,
  "reasoning": "Prediction is conditional on ETF approval. Filter removed the 'if' clause to make it appear unconditional."
}
```

### Example 5: Invalid - Future Timeframe

**Input:**

```json
{
  "current_date": "2025-01-20T00:00:00Z",
  "thread_tweets": [
    { "text": "BTC will hit 100k by end of 2026. Mark my words!" }
  ],
  "goal_slices": [{ "text": "BTC will hit 100k" }],
  "timeframe_slices": [{ "text": "by end of 2026" }],
  "timeframe_parsed": {
    "start_utc": "2025-01-20T00:00:00Z",
    "end_utc": "2026-12-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "Author is making a confident price prediction for Bitcoin reaching 100k by end of 2026.",
  "is_valid": false,
  "failure_cause": "future_timeframe",
  "confidence": 1.0,
  "reasoning": "While this is a valid prediction, the timeframe ends on 2026-12-31 which is after the current date of 2025-01-20. Prediction has not matured yet and cannot be verified."
}
```
