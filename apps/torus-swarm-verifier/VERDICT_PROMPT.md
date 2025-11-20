# Verdict Generation Prompt

## Goal

Determine if a prediction came true by searching for evidence and checking if the target was achieved within the specified timeframe.

**CRITICAL: This must be a PREDICTION, not NEWS reporting.** If the target was already true or was news BEFORE the prediction was made (before start_utc), the prediction is INVALID and must return verdict: false.

## Inputs

You will receive:

```json
{
  "context": "Author is making a confident price prediction for Bitcoin reaching 100k by end of Q1 2025.",
  "target_text": "BTC will hit 100k",
  "timeframe_text": "by end of Q1 2025",
  "timeframe_parsed": {
    "start_utc": "2024-11-15T12:00:00Z",
    "end_utc": "2025-03-31T23:59:59Z",
    "precision": "quarter"
  }
}
```

## Task

Search the web for evidence and determine if the target was achieved within the timeframe.

**Critical Instructions:**

1. **Check if this is a SELF-ANNOUNCEMENT, not a prediction:**
   - If the author is announcing their OWN actions, plans, or decisions, this is NOT a prediction
   - Examples: Artist announcing album release, athlete announcing retirement, CEO announcing product launch
   - The author must be predicting something OUTSIDE their control
   - This includes both obvious announcements ("I'm releasing X") and subtle ones ("And now I get to tour America??")
   - If this is a self-announcement, valid MUST be false

2. **Check if this was NEWS, not a prediction:**
   - **CRITICAL: Check if the event was ANNOUNCED/DECIDED before the tweet, even if it hasn't HAPPENED yet**
   - Search for evidence that the target was ALREADY ANNOUNCED, SIGNED, PASSED, or DECIDED before start_utc
   - News organizations reporting on already-announced future events are NOT making predictions
   - **Common patterns that indicate NEWS, not predictions:**
     - Laws/bills that were already SIGNED/PASSED (even if enforcement is future)
     - Products/features already ANNOUNCED by companies (even if release is future)
     - Events already CONFIRMED by organizers (even if the event date is future)
     - Contracts/deals already SIGNED (even if execution is future)
     - Company statements/press releases announcing future plans
   - **How to verify:**
     - Search for official announcements, press releases, or news reports BEFORE start_utc
     - Check if the decision/commitment was already public knowledge
     - If other sources reported the same thing BEFORE this tweet, it's news, not a prediction
   - **Examples:**
     - "Florida will ban social media for under-14s from Jan 2025" tweeted March 2024 → INVALID if bill was signed before March 2024
     - "Apple will use USB-C by 2024" tweeted Oct 2022 → INVALID if EU law was passed before Oct 2022
     - "Fortnite returns to iOS this year" → INVALID if Epic already announced it
   - If the target was already decided/announced BEFORE the prediction was made, valid MUST be false

3. **Only evaluate predictions that were actually predictive:**
   - ONLY consider evidence from dates between start_utc and end_utc
   - Ignore any evidence from after end_utc (too late)
   - For price predictions: Target reached at ANY point during the window counts as true
   - If you cannot find sufficient evidence, verdict is false

4. **Search authoritative sources:**
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

- Author is announcing their own actions/plans (self-announcement, not a prediction)
- Target was already achieved/announced BEFORE start_utc (this was news, not a prediction)
- When valid=false, verdict should also be false

## Examples

### Example 1: True

**Input:**

```json
{
  "context": "Price prediction for Bitcoin.",
  "target_text": "BTC will hit 100k",
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
  "target_text": "BTC will hit 100k",
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
  "target_text": "BTC will hit 100k",
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
  "target_text": "BTC will hit 100k",
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

### Example 8: Invalid - Self-Announcement (Obvious)

**Input:**

```json
{
  "context": "Artist announcing new album release date on their own account.",
  "goal_text": "My new album drops July 17th",
  "timeframe_text": "July 17th",
  "timeframe_parsed": {
    "start_utc": "2025-05-10T18:30:00Z",
    "end_utc": "2025-07-17T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": false,
  "verdict": false,
  "confidence": 0.99,
  "reasoning": "This is a self-announcement where the author is declaring their own plans for releasing their album. The author has full control over when they release their album, so this is not a prediction about an uncertain future event. This is an announcement of their own decision, not a prediction. Prediction is invalid."
}
```

### Example 9: Invalid - Self-Announcement (Subtle)

**Input:**

```json
{
  "context": "Artist making an excited statement about touring.",
  "goal_text": "I get to tour America this year",
  "timeframe_text": "this year",
  "timeframe_parsed": {
    "start_utc": "2025-03-15T20:00:00Z",
    "end_utc": "2025-12-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": false,
  "verdict": false,
  "confidence": 0.97,
  "reasoning": "Despite the casual phrasing ('And now I get to tour'), this is the author announcing their own tour plans. The author controls their tour schedule, making this a self-announcement rather than a prediction. Even though it's phrased as an excited statement rather than a formal announcement, it's still declaring the author's own planned actions. Prediction is invalid."
}
```

### Example 10: Invalid - News About Already-Passed Law

**Input:**

```json
{
  "context": "News organization reporting on Florida social media ban for minors.",
  "target_text": "Florida will ban anyone under 14 owning a social media account",
  "timeframe_text": "from January 2025",
  "timeframe_parsed": {
    "start_utc": "2024-03-25T13:26:00Z",
    "end_utc": "2025-01-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": false,
  "verdict": false,
  "confidence": 0.98,
  "reasoning": "The tweet was made on March 25, 2024, and explicitly states 'The bill was signed today by Governor DeSantis.' This means the law was already PASSED and SIGNED before the tweet was made. While the enforcement date is January 2025 (future), the decision to ban was already made and publicly announced. This is news reporting on an already-signed law, not a prediction. A prediction would have been made BEFORE the bill was signed. Prediction is invalid."
}
```

### Example 11: Invalid - News About Already-Announced Product Return

**Input:**

```json
{
  "context": "News organization reporting that Fortnite will return to iOS in Europe.",
  "target_text": "Fortnite on iOS will return to Apple devices",
  "timeframe_text": "this year in Europe",
  "timeframe_parsed": {
    "start_utc": "2024-01-25T10:00:00Z",
    "end_utc": "2024-12-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": false,
  "verdict": false,
  "confidence": 0.96,
  "reasoning": "Search reveals that Epic Games had already announced plans to return Fortnite to iOS in Europe through the Digital Markets Act before January 25, 2024. Multiple news sources reported on Epic's official announcement in early January 2024. This tweet is reporting on Epic's already-announced plans, not making an original prediction. News organizations reporting on company announcements are not making predictions. Prediction is invalid."
}
```

### Example 12: Invalid - News About Already-Passed EU Law

**Input:**

```json
{
  "context": "Reporting on Apple being forced to adopt USB-C due to EU law.",
  "target_text": "Apple will be forced to get rid of their lightning port after the EU parliament passed a new law requiring the use of USB-C",
  "timeframe_text": "by 2024",
  "timeframe_parsed": {
    "start_utc": "2022-10-04T12:00:00Z",
    "end_utc": "2024-12-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": false,
  "verdict": false,
  "confidence": 0.99,
  "reasoning": "The tweet was made on October 4, 2022, and states 'after the EU parliament passed a new law' - meaning the law was ALREADY PASSED on the same day or before. According to European Parliament records, the vote to enforce USB-C happened on October 4, 2022. This tweet is reporting on a law that was just passed, not predicting future legislation. While the enforcement deadline (2024) is future, the legislative decision was already made. This is news reporting, not prediction. Prediction is invalid."
}
```

### Example 13: Invalid - News About Already-Announced Player Transfer

**Input:**

```json
{
  "context": "News organization reporting on S1mple joining FaZe Clan for specific events.",
  "target_text": "S1mple will compete at IEM Dallas and the BLAST Austin Major",
  "timeframe_text": "2025",
  "timeframe_parsed": {
    "start_utc": "2025-05-05T10:20:00Z",
    "end_utc": "2025-12-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "valid": false,
  "verdict": false,
  "confidence": 0.97,
  "reasoning": "The tweet states 'Legendary Counter Strike player S1mple has joined FaZe Clan on a 2-event loan' - note the past tense 'has joined.' This indicates the deal was already announced/finalized before the tweet. The tweet is reporting on an already-confirmed roster move and the specific events were already announced as part of that deal. This is news reporting on an already-announced agreement, not a prediction about whether S1mple would join or which events he would attend. Prediction is invalid."
}
```
