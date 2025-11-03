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

1. **Vague or unmeasurable goals**:
   - Subjective outcomes: "will be wild", "will be grim", "will be good/bad"
   - No clear success criteria: "will have consequences", "will impact X"
   - Abstract philosophical statements: "the West in decline", "the East ascendant"
   - Cannot objectively verify if it happened
   - Note: Conditionals with specific, measurable outcomes are VALID. Only reject if the goal itself is vague.

2. **Present-state commentary** (NOT predictions):
   - Describing current conditions: "we already face", "things are now"
   - Ongoing analysis of existing situations
   - If it's about what IS rather than what WILL BE, it's not a prediction

3. **Negation**: "I don't think", "won't", "unlikely"

4. **Sarcasm**: "lol", "lmao", emojis, "yeah right"

5. **Quoting others**: Author quoting someone else's view

6. **Heavy hedging**: "maybe", "possibly", "could"

7. **Future timeframe**: Prediction end_utc is AFTER current_date (not yet mature for verification)

## Output Format

Return ONLY valid JSON (no markdown fences):

```json
{
  "context": "Brief summary of what the thread is about and what the author was saying",
  "is_valid": true | false,
  "failure_cause": "vague_goal" | "present_state" | "negation" | "sarcasm" | "quoting_others" | "heavy_hedging" | "future_timeframe" | "other" | null,
  "confidence": 0.95,
  "reasoning": "Explanation of why this is or isn't a valid prediction"
}
```

**Fields:**

- `context`: Brief summary of the thread and what the author was saying
- `is_valid`: Boolean indicating if this is a valid prediction
- `failure_cause`: Category of failure (null if is_valid is true). Must be one of:
  - `"vague_goal"`: Goal is subjective, unmeasurable, or has no clear success criteria
  - `"present_state"`: Statement about current conditions, not a future prediction
  - `"negation"`: Prediction is negated ("I don't think", "won't", "unlikely")
  - `"sarcasm"`: Sarcastic or joking tone ("lol", "lmao", emojis)
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

### Example 4: Invalid - Vague Goal

**Input:**

```json
{
  "current_date": "2025-04-15T00:00:00Z",
  "thread_tweets": [{ "text": "VR will be wild by end of Q1 2025" }],
  "goal_slices": [{ "text": "VR will be wild" }],
  "timeframe_slices": [{ "text": "by end of Q1 2025" }],
  "timeframe_parsed": {
    "start_utc": "2025-01-20T00:00:00Z",
    "end_utc": "2025-03-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "Author is making a vague prediction about VR technology becoming 'wild'.",
  "is_valid": false,
  "failure_cause": "vague_goal",
  "confidence": 0.95,
  "reasoning": "'Wild' is subjective with no clear success criteria. How would we objectively verify if VR became 'wild'? There's no measurable outcome to check. This is an opinion statement, not a verifiable prediction."
}
```

### Example 5: Invalid - Present State Commentary

**Input:**

```json
{
  "current_date": "2025-04-15T00:00:00Z",
  "thread_tweets": [
    {
      "text": "We already face a combination of supply chain disruptions and soaring prices for masks"
    }
  ],
  "goal_slices": [{ "text": "supply chain disruptions" }],
  "timeframe_slices": [{ "text": "already" }],
  "timeframe_parsed": {
    "start_utc": "2020-03-22T14:30:00Z",
    "end_utc": "2020-03-22T14:30:00Z"
  }
}
```

**Output:**

```json
{
  "context": "Author is describing current conditions in March 2020, not making a prediction about the future.",
  "is_valid": false,
  "failure_cause": "present_state",
  "confidence": 0.99,
  "reasoning": "'We already face' indicates this is commentary on existing conditions, not a prediction. The author is describing what IS happening, not what WILL happen. This is analysis of the present, not a forecast."
}
```

### Example 6: Valid - Conditional with Specific Outcome

**Input:**

```json
{
  "current_date": "2025-01-20T00:00:00Z",
  "thread_tweets": [
    { "text": "If BTC breaks $95k resistance, it will hit $100k within a week" }
  ],
  "goal_slices": [{ "text": "it will hit $100k" }],
  "timeframe_slices": [{ "text": "within a week" }],
  "timeframe_parsed": {
    "start_utc": "2025-01-20T00:00:00Z",
    "end_utc": "2025-01-27T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "Author is making a conditional price prediction: if BTC breaks $95k, it will reach $100k within a week.",
  "is_valid": true,
  "failure_cause": null,
  "confidence": 0.92,
  "reasoning": "While this is conditional, both the condition ($95k break) and outcome ($100k target) are specific and measurable. We can verify if the condition was met and then check if the outcome happened. This is a legitimate causal prediction, not a vague statement."
}
```

### Example 7: Invalid - Future Timeframe

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
