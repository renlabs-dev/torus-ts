# Timeframe Extraction Prompt for Gemini

## Goal

Extract and normalize the prediction deadline into concrete UTC ISO-8601 timestamps.

- Read the timeframe text and any relevant context from the thread.
- Normalize any timeline or deadline into UTC ISO-8601 timestamps.
- If no concrete timeline exists or it's too vague, mark as unverifiable.
- Do NOT assess the prediction's truth; only extract time bounds.

## Inputs

You will receive:

```json
{
  "timeframe_text": "by end of Q1 2025",
  "target_text": "BTC will hit 100k",
  "tweet_timestamp": "2024-11-15T12:00:00Z",
  "current_time": "2025-01-20T10:00:00Z",
  "thread_context": "Optional: surrounding tweets if they clarify the timeframe"
}
```

## Rules

### Temporal Anchoring

- Anchor ALL relative phrases to `tweet_timestamp`, NOT `current_time`.
- Example: "in 3 months" posted on 2024-11-15 → deadline is 2025-02-15, regardless of when we verify.

### Date Interpretation

- **"by <date>"**: Inclusive, deadline at 23:59:59 UTC of that date.
  - "by June 2025" → 2025-06-30T23:59:59Z
  - "by March 31" → YYYY-03-31T23:59:59Z (year from context)

- **"before <date>"**: Exclusive, deadline at 00:00:00 UTC of that date.
  - "before June 2025" → 2025-06-01T00:00:00Z

- **"within N days/weeks/months/years"**: Window from tweet_timestamp + N units.
  - Deadline inclusive at 23:59:59 UTC.
  - "within 6 months" posted 2025-01-15 → 2025-07-15T23:59:59Z

- **"in N days/weeks/months"**: Same as "within N".

### Quarters and Periods

- **Quarters**: Assume calendar year unless explicitly stated as fiscal.
  - Q1 = Jan 1 – Mar 31 (ends 03-31T23:59:59Z)
  - Q2 = Apr 1 – Jun 30 (ends 06-30T23:59:59Z)
  - Q3 = Jul 1 – Sep 30 (ends 09-30T23:59:59Z)
  - Q4 = Oct 1 – Dec 31 (ends 12-31T23:59:59Z)

- **Halves**:
  - H1 = Jan 1 – Jun 30 (ends 06-30T23:59:59Z)
  - H2 = Jul 1 – Dec 31 (ends 12-31T23:59:59Z)

### Time Idioms

- **EOD** (end of day): 23:59:59 UTC of the referenced day
- **EOW** (end of week): Sunday 23:59:59 UTC
- **EOM** (end of month): Last day of month 23:59:59 UTC
- **EOY** (end of year): December 31 23:59:59 UTC
- **"this week/month/year"**: Relative to tweet_timestamp
- **"next week/month/year"**: Following period from tweet_timestamp

### Relative Day References

When tweet says "by Friday" or "next Tuesday":

- Calculate from tweet_timestamp day-of-week
- "this Friday" = upcoming Friday in same week
- "next Friday" = Friday of following week
- Always use 23:59:59 UTC for deadline

### Timezone Handling

- Default to UTC unless timezone is explicitly mentioned.
- If explicit timezone mentioned ("EST", "PST", "CET"), convert to UTC.
- Twitter market predictions often reference:
  - NYSE/NASDAQ close: 21:00:00 UTC (4 PM EST)
  - Crypto: 24/7, use 23:59:59 UTC for daily deadlines

### Multiple Timeframes

If multiple timelines appear in text:

1. Prefer the most specific and binding deadline.
2. If conflicting, choose the EARLIEST (most conservative).
3. Note the conflict in `reasoning` field.

### Invalid Timeframes (Mark as Missing)

These are NOT valid timeframes and should be marked as `timeframe_status: "missing"`:

**1. Vague Temporal Phrases:**

- "soon", "eventually", "someday", "one day"
- "in the future", "in the near future", "in the coming years"
- "before too long", "at some point"
- "down the road", "down the line"
- "yet" (as in "don't write an obituary yet")

**2. Non-Temporal Words:**

- Single words that aren't time references: "will", "would", "should", "may"
- Meta-prediction phrases: "I'm predicting", "I predict", "I think", "I believe", "I'm calling"
- Verbs or auxiliaries mistakenly extracted as timeframes
- Random words from the sentence
- These are statements ABOUT making predictions, not temporal deadlines

**3. Excessively Long Timeframes:**

- Multi-decade predictions: "the 21st century", "this century"
- Any timeframe exceeding 10 years from tweet_timestamp
- Reason: Too long to be meaningfully verifiable

**4. Conditional Phrases (NOT timeframes):**

- "when X happens" - This is a condition, not a time
- "if/once/after X" - These are event triggers, not temporal deadlines
- "when checks hit", "once approved", "after the announcement"
- Mark these as `timeframe_status: "event_trigger"` if they reference a specific event
- Mark as `timeframe_status: "missing"` if too vague

**When you see these patterns, return `timeframe_status: "missing"` with null timestamps.**

### Event-Triggered Phrases

Phrases tied to external events:

- "when X releases", "after the halving", "once approved"
- "when the merger completes", "after the election"

**Handling:**

1. Check if thread_context provides clarification (e.g., "the halving in April 2024").
2. If event has a known date, use it.
3. If event date is unknown, mark as `timeframe_status: "event_trigger"`.
4. Do NOT guess event dates.

### Inference Bias

- **Strong bias toward bounded windows**: When vague, infer a conservative deadline.
- **"this will happen"** (no explicit time) → infer 1 year from tweet_timestamp.
- **"X is going to Y"** (future tense, no time) → infer 6 months conservative.
- Only use `missing` when truly unbounded or event-triggered with unknown date.

## Output Format

Return ONLY valid JSON (no markdown fences, no extra text):

```json
{
  "timeframe_status": "explicit" | "implicit" | "inferred" | "event_trigger" | "missing",
  "start_utc": "2024-11-15T12:00:00Z",
  "end_utc": "2025-06-30T23:59:59Z",
  "precision": "hour" | "day" | "week" | "month" | "quarter" | "year",
  "reasoning": "Brief explanation of how you arrived at this timeframe",
  "assumptions": ["list", "of", "assumptions", "made"],
  "confidence": 0.95
}
```

### Field Definitions

**timeframe_status:**

- `explicit`: Clear date/range in text ("by June 2025", "in Q1 2026")
- `implicit`: Time anchored indirectly but reasonable ("within a year", "over the next 6 months")
- `inferred`: Derived via conservative reasoning when text is vague ("this will flip" → infer 1 year)
- `event_trigger`: Depends on external event with unknown date ("after the halving")
- `missing`: No bounded window can be inferred ("eventually", "someday")

**start_utc:**

- Usually the tweet_timestamp (when prediction was made)
- Can be null if prediction has no clear start

**end_utc:**

- The deadline for verification (when to check if prediction came true)
- Must be null only if timeframe_status is "event_trigger" or "missing"

**precision:**

- Indicates granularity of the timeframe
- Affects how we interpret boundary cases

**confidence:**

- 0.0 to 1.0
- How confident you are in this interpretation
- Lower if ambiguous or inferred

## Examples

### Example 1: Explicit Date

**Input:**

```json
{
  "timeframe_text": "by end of Q1 2025",
  "target_text": "BTC will hit 100k",
  "tweet_timestamp": "2024-11-15T12:00:00Z",
  "current_time": "2025-01-20T10:00:00Z"
}
```

**Output:**

```json
{
  "timeframe_status": "explicit",
  "start_utc": "2024-11-15T12:00:00Z",
  "end_utc": "2025-03-31T23:59:59Z",
  "precision": "quarter",
  "reasoning": "Q1 2025 ends March 31, using calendar quarters, end of day UTC",
  "assumptions": ["calendar Q1 not fiscal", "UTC timezone"],
  "confidence": 1.0
}
```

---

### Example 2: Relative Time

**Input:**

```json
{
  "timeframe_text": "within 3 months",
  "goal_text": "ETH will flip BTC",
  "tweet_timestamp": "2025-01-15T09:30:00Z",
  "current_time": "2025-02-20T10:00:00Z"
}
```

**Output:**

```json
{
  "timeframe_status": "implicit",
  "start_utc": "2025-01-15T09:30:00Z",
  "end_utc": "2025-04-15T23:59:59Z",
  "precision": "day",
  "reasoning": "3 months from tweet timestamp (2025-01-15) is 2025-04-15, end of day",
  "assumptions": ["calendar months", "inclusive deadline at EOD"],
  "confidence": 0.95
}
```

---

### Example 3: Day Reference

**Input:**

```json
{
  "timeframe_text": "by Friday",
  "goal_text": "SOL above $200",
  "tweet_timestamp": "2025-01-20T14:00:00Z",
  "current_time": "2025-01-21T10:00:00Z"
}
```

Tweet posted: Monday Jan 20, 2025

**Output:**

```json
{
  "timeframe_status": "explicit",
  "start_utc": "2025-01-20T14:00:00Z",
  "end_utc": "2025-01-24T23:59:59Z",
  "precision": "day",
  "reasoning": "Tweet posted Monday Jan 20, 'by Friday' means Jan 24 end of day",
  "assumptions": ["this week's Friday", "UTC EOD"],
  "confidence": 0.9
}
```

---

### Example 4: Vague (Unverifiable)

**Input:**

```json
{
  "timeframe_text": "soon",
  "goal_text": "BTC will moon",
  "tweet_timestamp": "2025-01-15T09:30:00Z",
  "current_time": "2025-02-20T10:00:00Z"
}
```

**Output:**

```json
{
  "timeframe_status": "missing",
  "start_utc": null,
  "end_utc": null,
  "precision": "unbounded",
  "reasoning": "'soon' is too vague to establish a falsifiable deadline",
  "assumptions": [],
  "confidence": 1.0
}
```

---

### Example 5: Inferred Conservative

**Input:**

```json
{
  "timeframe_text": "this is going to happen",
  "goal_text": "TSLA will hit $500",
  "tweet_timestamp": "2025-01-15T09:30:00Z",
  "current_time": "2025-02-20T10:00:00Z"
}
```

**Output:**

```json
{
  "timeframe_status": "inferred",
  "start_utc": "2025-01-15T09:30:00Z",
  "end_utc": "2026-01-15T23:59:59Z",
  "precision": "year",
  "reasoning": "No explicit timeframe; inferred 1 year as conservative default for price predictions",
  "assumptions": [
    "1 year conservative window",
    "standard market prediction timeframe"
  ],
  "confidence": 0.5
}
```

---

### Example 6: Event Trigger

**Input:**

```json
{
  "timeframe_text": "after the BTC halving",
  "goal_text": "BTC will reach 150k",
  "tweet_timestamp": "2023-11-15T12:00:00Z",
  "current_time": "2024-01-20T10:00:00Z",
  "thread_context": "No additional context about halving date"
}
```

**Output:**

```json
{
  "timeframe_status": "event_trigger",
  "start_utc": null,
  "end_utc": null,
  "precision": "event",
  "reasoning": "Tied to BTC halving event with no specific date provided in context",
  "assumptions": ["BTC halving ~April 2024 historically"],
  "confidence": 0.3
}
```

**Note:** If thread_context mentioned "the halving in April 2024", would become:

```json
{
  "timeframe_status": "explicit",
  "start_utc": "2024-04-01T00:00:00Z",
  "end_utc": "2024-04-30T23:59:59Z",
  "precision": "month",
  "reasoning": "Context clarified halving in April 2024",
  "assumptions": ["full month of April as window"],
  "confidence": 0.85
}
```

---

### Example 7: Invalid - Non-Temporal Word

**Input:**

```json
{
  "timeframe_text": "Will",
  "goal_text": "have enormous consequences",
  "tweet_timestamp": "2020-03-15T10:00:00Z",
  "current_time": "2025-01-20T10:00:00Z"
}
```

**Output:**

```json
{
  "timeframe_status": "missing",
  "start_utc": null,
  "end_utc": null,
  "precision": "unbounded",
  "reasoning": "'Will' is a verb/auxiliary, not a timeframe. This appears to be a filter extraction error.",
  "assumptions": [],
  "confidence": 1.0
}
```

---

### Example 8: Invalid - "Yet" is Not a Timeframe

**Input:**

```json
{
  "timeframe_text": "yet",
  "goal_text": "Don't write an obituary for globalism",
  "tweet_timestamp": "2020-03-20T12:00:00Z",
  "current_time": "2025-01-20T10:00:00Z"
}
```

**Output:**

```json
{
  "timeframe_status": "missing",
  "start_utc": null,
  "end_utc": null,
  "precision": "unbounded",
  "reasoning": "'yet' means 'at this time' or 'so far', not a future deadline. No verifiable timeframe exists.",
  "assumptions": [],
  "confidence": 1.0
}
```

---

### Example 9: Invalid - Excessively Long Timeframe

**Input:**

```json
{
  "timeframe_text": "The 21st century",
  "goal_text": "The East will be in ascendance",
  "tweet_timestamp": "2020-03-15T10:00:00Z",
  "current_time": "2025-01-20T10:00:00Z"
}
```

**Output:**

```json
{
  "timeframe_status": "missing",
  "start_utc": null,
  "end_utc": null,
  "precision": "unbounded",
  "reasoning": "21st century spans 100 years (2001-2100). This is too long to be a meaningful verifiable prediction. Maximum reasonable timeframe is 10 years.",
  "assumptions": [],
  "confidence": 1.0
}
```

---

### Example 10: Invalid - Conditional Phrase Not a Timeframe

**Input:**

```json
{
  "timeframe_text": "When checks hit",
  "goal_text": "people will spend on consumer staples",
  "tweet_timestamp": "2020-03-22T14:30:00Z",
  "current_time": "2025-01-20T10:00:00Z"
}
```

**Output:**

```json
{
  "timeframe_status": "missing",
  "start_utc": null,
  "end_utc": null,
  "precision": "unbounded",
  "reasoning": "'When checks hit' is a conditional trigger, not a temporal deadline. This is an 'if X then Y' statement, not a time-bound prediction.",
  "assumptions": [],
  "confidence": 1.0
}
```

---

### Example 11: Invalid - "In the Future" is Vague

**Input:**

```json
{
  "timeframe_text": "In the future",
  "goal_text": "BTC will dominate in hashpower charts",
  "tweet_timestamp": "2020-03-20T10:00:00Z",
  "current_time": "2025-01-20T10:00:00Z"
}
```

**Output:**

```json
{
  "timeframe_status": "missing",
  "start_utc": null,
  "end_utc": null,
  "precision": "unbounded",
  "reasoning": "'In the future' is completely unbounded with no specific deadline. This could mean next week or in 50 years. There's no way to determine when to verify this prediction.",
  "assumptions": [],
  "confidence": 1.0
}
```

---

### Example 12: Invalid - Meta-Prediction Phrase

**Input:**

```json
{
  "timeframe_text": "I'm predicting",
  "goal_text": "the start of a California independence movement",
  "tweet_timestamp": "2020-03-18T16:00:00Z",
  "current_time": "2025-01-20T10:00:00Z"
}
```

**Output:**

```json
{
  "timeframe_status": "missing",
  "start_utc": null,
  "end_utc": null,
  "precision": "unbounded",
  "reasoning": "'I'm predicting' is a meta-statement about making a prediction, not a timeframe. This describes the ACT of predicting, not WHEN the prediction will come true. No temporal deadline exists.",
  "assumptions": [],
  "confidence": 1.0
}
```

---

### Example 12: Thread Context Clarification

**Input:**

```json
{
  "timeframe_text": "by then",
  "goal_text": "we'll see 10k ETH",
  "tweet_timestamp": "2025-01-15T09:30:00Z",
  "current_time": "2025-02-20T10:00:00Z",
  "thread_context": "Previous tweet in thread: 'Q2 2025 will be wild'"
}
```

**Output:**

```json
{
  "timeframe_status": "implicit",
  "start_utc": "2025-01-15T09:30:00Z",
  "end_utc": "2025-06-30T23:59:59Z",
  "precision": "quarter",
  "reasoning": "'by then' refers to Q2 2025 mentioned in thread context",
  "assumptions": ["'then' refers to Q2 from previous tweet", "end of Q2"],
  "confidence": 0.75
}
```

---

## Edge Cases to Handle

### Conflicting Times

Text: "BTC to 100k by June or July 2025"
→ Choose June (earliest/most conservative)

### Past Deadlines

If `end_utc` > `current_time`, that's fine. Just extract what was said.
We'll handle maturity checking separately.

### Year Ambiguity

Text: "by March" (no year mentioned)
→ If tweet is in 2024 and March hasn't passed, use 2024-03-31
→ If tweet is in November 2024, "by March" likely means 2025-03-31

### Implicit "This Year"

Text: "before June" (tweet posted in January 2025)
→ Assume 2025-06-01T00:00:00Z

### Trading Hours

Text: "by market close Friday"
→ Assume NYSE close: Friday 21:00:00 UTC (4 PM EST)

## Important Reminders

1. **Always anchor to tweet_timestamp**, never to current_time
2. **Be conservative**: When uncertain, choose shorter/earlier deadline
3. **Use UTC**: Convert all timezones to UTC
4. **End of day = 23:59:59**: For date-only deadlines
5. **Return valid JSON only**: No markdown, no extra text
6. **Use thread_context**: It may clarify vague references
7. **Confidence matters**: Lower confidence for inferred/ambiguous cases
8. **Precision guides interpretation**: "month" precision = less strict than "day"

## Testing Your Output

Before returning, verify:

- [ ] `end_utc` is a valid ISO-8601 timestamp or null
- [ ] `start_utc` is a valid ISO-8601 timestamp or null
- [ ] If status is "explicit", "implicit", or "inferred", `end_utc` must NOT be null
- [ ] `confidence` is between 0.0 and 1.0
- [ ] `reasoning` explains your logic clearly
- [ ] JSON is valid (no trailing commas, proper quotes)
