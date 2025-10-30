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
  "reasoning": "Explanation of why this is or isn't a valid prediction"
}
```

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
  "reasoning": "While this is a valid prediction, the timeframe ends on 2026-12-31 which is after the current date of 2025-01-20. Prediction has not matured yet and cannot be verified."
}
```
