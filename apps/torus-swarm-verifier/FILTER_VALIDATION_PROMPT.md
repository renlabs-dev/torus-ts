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
  "target_slices": [
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

**CRITICAL: First check slice extraction quality:**

Before evaluating the prediction content, verify the filter didn't create broken extractions:

1. **Word boundary violations**: Check if slices cut through the middle of words
   - Compare the extracted text against the full tweet at those indices
   - Example: Extracting "now" from "k**now**" is INVALID - it cuts through the word "know"
   - If a slice doesn't align with word boundaries, mark as invalid with `failure_cause: "broken_extraction"`

2. **Semantic validity of extracted text**: Does the extracted text make sense in isolation?
   - Is the timeframe slice actually a temporal expression? (not just random word fragments)
   - Is the target slice actually a predictive statement? (not just disconnected fragments)
   - If extractions are nonsensical or fragments, mark as invalid with `failure_cause: "broken_extraction"`

**Then check for disqualifying factors:**

1. **Self-announcements** (NOT predictions):
   - Author announcing their OWN actions, plans, decisions, or products
   - Examples: Company announcing product release, artist announcing tour, athlete announcing retirement
   - Includes both obvious ("I'm releasing X") and subtle ("And now I get to tour America??") announcements
   - Check if the author is the same entity that controls the outcome
   - Look for linguistic clues of ownership/control:
     - First-person plural: "we", "our", "us" (e.g., "our new product", "we're launching")
     - Phrases indicating control: "Get ready for X from [Company]", "X is coming to [Company]"
     - Responding to questions about the company's own products/services
     - Making statements about the company's own seasonal/recurring offerings (e.g., "McRib will come around again")
     - Announcing company-specific promotions, products, or events (e.g., "Beyblades from McDonald's next month")
   - If the tweet discusses when a product/service will be available from that same organization, it's a self-announcement
   - The author must be predicting something OUTSIDE their control, not their own business decisions

2. **Personal or local actions** (NOT publicly verifiable predictions):
   - Actions directed at specific individuals, not general public events
   - Examples: "you will receive an email", "we'll send you a refund", "I'll reply to your DM"
   - Customer service responses about individual cases
   - Cannot be objectively verified by third parties
   - If it's a private interaction or personal action, it's not a prediction

3. **Vague or unmeasurable targets**:
   - Subjective outcomes: "will be wild", "will be grim", "will be good/bad"
   - No clear success criteria: "will have consequences", "will impact X"
   - Abstract philosophical statements: "the West in decline", "the East ascendant"
   - Cannot objectively verify if it happened
   - Note: Conditionals with specific, measurable outcomes are VALID. Only reject if the target itself is vague.

4. **Present-state commentary** (NOT predictions):
   - Describing current conditions: "we already face", "things are now"
   - Ongoing analysis of existing situations
   - **News reporting on already-decided/announced events (even if execution is future):**
     - "The bill was signed today" - the signing IS done, execution later doesn't make it a prediction
     - "Parliament passed a new law" - the law IS passed, enforcement later doesn't make it a prediction
     - "Company announced" / "Company confirmed" - the announcement IS made
     - "Player has joined" (past tense) - the signing IS complete
     - These describe PRESENT STATE (decision exists now), not future uncertainty
   - **Key distinction**: If the decision/commitment/announcement already happened, it's present state
   - If it's about what IS (or what HAS BEEN decided) rather than what WILL BE, it's not a prediction

5. **Questions** (NOT predictions):
   - Rhetorical questions: "Could X be the next big Y?", "Will these records be broken?"
   - Speculative questions: "Is this the end of Z?"
   - Questions are inherently uncertain and non-committal - they're asking, not predicting
   - Even if the answer is obviously yes/no, a question is not a statement of prediction

6. **Quoting others** (NOT predictions):
   - Author reporting someone else's prediction or claim
   - Examples: "Expert claims X will happen", "Analyst says Y will occur", "Shoutcaster predicts Z"
   - Look for attribution: "claims", "says", "predicts", "according to"
   - The author is not making their own prediction, just reporting what someone else said
   - Even if the quoted prediction comes true, the author wasn't making the prediction

7. **Trivial/obvious outcomes**:
   - Stating obvious consequences: "This list will change after a tournament", "Scores will be different tomorrow"
   - No meaningful uncertainty - outcome is essentially guaranteed
   - These are observations about obvious causality, not predictions
   - Example: "The leaderboard will change during a $30M tournament" - obviously yes

8. **Negation**: "I don't think", "won't", "unlikely"

9. **Sarcasm**: "lol", "lmao", emojis, "yeah right"

10. **Heavy hedging**: "maybe", "possibly", "could"

11. **Future timeframe**: Prediction end_utc is AFTER current_date (not yet mature for verification)

## Output Format

Return ONLY valid JSON (no markdown fences):

```json
{
  "context": "Brief summary of what the thread is about and what the author was saying",
  "is_valid": true | false,
  "failure_cause": "BROKEN_EXTRACTION" | "SELF_ANNOUNCEMENT" | "PERSONAL_ACTION" | "VAGUE_TARGET" | "PRESENT_STATE" | "NEGATION" | "SARCASM" | "QUOTING_OTHERS" | "HEAVY_HEDGING" | "FUTURE_TIMEFRAME" | "OTHER" | null,
  "confidence": 0.95,
  "reasoning": "Explanation of why this is or isn't a valid prediction"
}
```

**Fields:**

- `context`: Brief summary of the thread and what the author was saying
- `is_valid`: Boolean indicating if this is a valid prediction
- `failure_cause`: Category of failure (null if is_valid is true). Must be one of:
  - `"BROKEN_EXTRACTION"`: Slices cut through word boundaries or extract nonsensical fragments
  - `"SELF_ANNOUNCEMENT"`: Author announcing their own actions/products (not a prediction)
  - `"PERSONAL_ACTION"`: Local/personal actions directed at individuals, not publicly verifiable
  - `"VAGUE_TARGET"`: Target is subjective, unmeasurable, or has no clear success criteria
  - `"PRESENT_STATE"`: Statement about current conditions, not a future prediction
  - `"NEGATION"`: Prediction is negated ("I don't think", "won't", "unlikely")
  - `"SARCASM"`: Sarcastic or joking tone ("lol", "lmao", emojis)
  - `"QUOTING_OTHERS"`: Author is quoting someone else's view (not making their own prediction)
  - `"HEAVY_HEDGING"`: Heavily hedged ("maybe", "possibly", "could")
  - `"FUTURE_TIMEFRAME"`: Prediction hasn't matured yet (end_utc > current_date)
  - `"OTHER"`: Other disqualifying factors including questions, trivial/obvious outcomes, and patterns not covered above
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
  "target_slices": [{ "text": "BTC will hit 100k" }],
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

### Example 2: Invalid - Broken Extraction (Word Boundary Violation)

**Input:**

```json
{
  "current_date": "2025-04-15T00:00:00Z",
  "thread_tweets": [
    {
      "tweet_id": "123456789",
      "text": "@vgr My critique is deeper than \"Metaverse Wikipedia will beat Metaverse Encyclopedia Britannica\". It's that we don't really know the definition of \"the metaverse\" yet, it's far too early to know what people actually want. So anything Facebook creates now will misfire."
    }
  ],
  "target_slices": [
    {
      "tweet_id": "123456789",
      "start": 180,
      "end": 183,
      "text": "now"
    }
  ],
  "timeframe_slices": [
    {
      "tweet_id": "123456789",
      "start": 175,
      "end": 178,
      "text": "now"
    }
  ],
  "timeframe_parsed": {
    "start_utc": "2020-03-18T10:00:00Z",
    "end_utc": "2020-03-18T10:00:00Z"
  }
}
```

**Output:**

```json
{
  "context": "Author is critiquing Facebook's metaverse strategy, saying it's too early to know what people want.",
  "is_valid": false,
  "failure_cause": "BROKEN_EXTRACTION",
  "confidence": 0.99,
  "reasoning": "The filter extracted 'now' from the middle of the word 'know' at position 175-178. Looking at the full tweet, this is part of the phrase 'we don't really know' - the filter cut through the word boundary. The extracted 'now' is not a temporal expression but a fragment of the word 'know'. This is a broken extraction that doesn't represent the actual tweet content."
}
```

### Example 3: Invalid - Negation

**Input:**

```json
{
  "current_date": "2025-04-15T00:00:00Z",
  "thread_tweets": [
    { "text": "I don't think BTC will hit 100k by end of Q1 tbh" }
  ],
  "target_slices": [{ "text": "BTC will hit 100k" }],
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
  "failure_cause": "NEGATION",
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
  "target_slices": [{ "text": "BTC will totally hit 100k" }],
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
  "failure_cause": "SARCASM",
  "confidence": 0.97,
  "reasoning": "Clear sarcasm indicators: 'totally', 'lmaooo', clown emoji, and unrealistic timeframe. This is a joke, not a serious prediction."
}
```

### Example 4: Invalid - Vague Target

**Input:**

```json
{
  "current_date": "2025-04-15T00:00:00Z",
  "thread_tweets": [{ "text": "VR will be wild by end of Q1 2025" }],
  "target_slices": [{ "text": "VR will be wild" }],
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
  "failure_cause": "VAGUE_TARGET",
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
  "target_slices": [{ "text": "supply chain disruptions" }],
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
  "failure_cause": "PRESENT_STATE",
  "confidence": 0.99,
  "reasoning": "'We already face' indicates this is commentary on existing conditions, not a prediction. The author is describing what IS happening, not what WILL happen. This is analysis of the present, not a forecast."
}
```

### Example 5b: Invalid - News Reporting (Already-Signed Law)

**Input:**

```json
{
  "current_date": "2025-01-31T00:00:00Z",
  "thread_tweets": [
    {
      "text": "Florida will ban anyone under 14 owning a social media account from January 2025, deleting existing accounts. The bill was signed today by Governor DeSantis"
    }
  ],
  "target_slices": [{ "text": "Florida will ban anyone under 14 owning a social media account" }],
  "timeframe_slices": [{ "text": "from January 2025" }],
  "timeframe_parsed": {
    "start_utc": "2024-03-25T13:26:00Z",
    "end_utc": "2025-01-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "News organization reporting on Florida's social media age restriction law that was just signed into law.",
  "is_valid": false,
  "failure_cause": "PRESENT_STATE",
  "confidence": 0.98,
  "reasoning": "The text explicitly states 'The bill was signed today by Governor DeSantis.' This is present state - the bill IS signed, the decision HAS BEEN made. While the enforcement happens in January 2025 (future), the commitment/decision exists NOW. This is news reporting on a present reality (signed law), not a prediction about whether a law will pass. A prediction would have been made BEFORE the bill was signed."
}
```

### Example 5c: Invalid - News Reporting (Past Tense Announcement)

**Input:**

```json
{
  "current_date": "2025-12-31T00:00:00Z",
  "thread_tweets": [
    {
      "text": "Legendary Counter Strike player S1mple has joined FaZe Clan on a 2-event loan for his highly anticipated return. The Ukrainian champion will compete at IEM Dallas and the BLAST Austin Major 2025"
    }
  ],
  "target_slices": [{ "text": "S1mple will compete at IEM Dallas and the BLAST Austin Major" }],
  "timeframe_slices": [{ "text": "2025" }],
  "timeframe_parsed": {
    "start_utc": "2025-05-05T10:20:00Z",
    "end_utc": "2025-12-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "News organization reporting on S1mple's roster move and which events he will attend.",
  "is_valid": false,
  "failure_cause": "PRESENT_STATE",
  "confidence": 0.97,
  "reasoning": "The text states 'S1mple has joined' (past tense) - the deal IS done, the commitment HAS BEEN made. The specific events (IEM Dallas, BLAST Austin Major) were part of the already-announced agreement. This is present state - the contract exists NOW, the events are already scheduled NOW. This is news reporting on a completed deal and its terms, not a prediction about whether S1mple would join or which events he'd attend."
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
  "target_slices": [{ "text": "it will hit $100k" }],
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
  "target_slices": [{ "text": "BTC will hit 100k" }],
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
  "failure_cause": "FUTURE_TIMEFRAME",
  "confidence": 1.0,
  "reasoning": "While this is a valid prediction, the timeframe ends on 2026-12-31 which is after the current date of 2025-01-20. Prediction has not matured yet and cannot be verified."
}
```

### Example 8: Invalid - Self-Announcement

**Input:**

```json
{
  "current_date": "2025-04-15T00:00:00Z",
  "thread_tweets": [
    {
      "tweet_id": "123456789",
      "author": "@McDonalds",
      "date": "2024-10-25T17:46:00Z",
      "text": "@SoulsofMystery hey Billy! yes, surely, the Nether Sauce will be available starting April 1st, 2025."
    }
  ],
  "target_slices": [{ "text": "the Nether Sauce will be available" }],
  "timeframe_slices": [{ "text": "starting April 1st, 2025" }],
  "timeframe_parsed": {
    "start_utc": "2024-10-25T17:46:00Z",
    "end_utc": "2025-04-01T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "McDonald's official account is responding to a customer inquiry about when a new sauce product will be available.",
  "is_valid": false,
  "failure_cause": "SELF_ANNOUNCEMENT",
  "confidence": 0.99,
  "reasoning": "This is McDonald's (@McDonalds) announcing their own product release date. The company controls when they release the Nether Sauce, so this is not a prediction about an uncertain future event - it's a company announcement of their own plans. Self-announcements are not predictions."
}
```

### Example 9: Invalid - Personal Action

**Input:**

```json
{
  "current_date": "2025-04-15T00:00:00Z",
  "thread_tweets": [
    {
      "tweet_id": "987654321",
      "author": "@McDonalds",
      "date": "2025-03-10T14:20:00Z",
      "text": "@JohnDoe123 We're sorry to hear that! Our team will send you an email within 24 hours to resolve this issue."
    }
  ],
  "target_slices": [{ "text": "Our team will send you an email" }],
  "timeframe_slices": [{ "text": "within 24 hours" }],
  "timeframe_parsed": {
    "start_utc": "2025-03-10T14:20:00Z",
    "end_utc": "2025-03-11T14:20:00Z"
  }
}
```

**Output:**

```json
{
  "context": "McDonald's customer service responding to a specific user's complaint, promising to send them an email.",
  "is_valid": false,
  "failure_cause": "PERSONAL_ACTION",
  "confidence": 0.98,
  "reasoning": "This is a customer service response about a personal action directed at a specific individual (@JohnDoe123). The statement 'will send you an email' is a private interaction between the company and one user. This is not a publicly verifiable prediction - no third party can verify whether this specific user received an email. Personal actions and individual customer service interactions are not predictions."
}
```

### Example 10: Invalid - Self-Announcement (Seasonal Product)

**Input:**

```json
{
  "current_date": "2021-12-01T00:00:00Z",
  "thread_tweets": [
    {
      "tweet_id": "1234567890",
      "author": "@1062894451171790848",
      "date": "2021-02-25T11:55:00Z",
      "text": "@MikeWasBad Mike, the McRib is Seasonal & will come around again next Winter."
    }
  ],
  "target_slices": [
    { "text": "the McRib is Seasonal & will come around again" }
  ],
  "timeframe_slices": [{ "text": "next Winter" }],
  "timeframe_parsed": {
    "start_utc": "2021-02-25T11:55:00Z",
    "end_utc": "2021-12-21T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "Company responding to a customer question about when the McRib will return, stating it's seasonal and will be back next winter.",
  "is_valid": false,
  "failure_cause": "SELF_ANNOUNCEMENT",
  "confidence": 0.97,
  "reasoning": "This is a company responding about their own seasonal product offering. The McRib is McDonald's product, and they control when it's available. Even though the author ID is numeric, the linguistic pattern is clear: they're responding to a customer question about their own product and announcing when it will return. The company controls this decision, making it a self-announcement rather than a prediction about an external event."
}
```

### Example 11: Invalid - Self-Announcement (Product Promotion)

**Input:**

```json
{
  "current_date": "2020-04-15T00:00:00Z",
  "thread_tweets": [
    {
      "tweet_id": "9876543210",
      "author": "@1062894451171790848",
      "date": "2020-03-24T00:23:00Z",
      "text": "Yo who's ready for Beyblades from McDonalds next month? 😳"
    }
  ],
  "target_slices": [{ "text": "Beyblades from McDonalds" }],
  "timeframe_slices": [{ "text": "next month" }],
  "timeframe_parsed": {
    "start_utc": "2020-03-24T00:23:00Z",
    "end_utc": "2020-04-30T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "Company account asking who's ready for Beyblades promotion coming to McDonald's next month.",
  "is_valid": false,
  "failure_cause": "SELF_ANNOUNCEMENT",
  "confidence": 0.98,
  "reasoning": "The key phrase 'Beyblades from McDonalds' indicates this is McDonald's announcing their own promotional item. The phrase 'from McDonalds' shows the author controls when this happens. This is a company hyping up their own upcoming promotion, not predicting an external event. Even phrased as a question ('who's ready'), this is clearly a promotional announcement of their own business decision."
}
```

### Example 12: Invalid - Question (Rhetorical)

**Input:**

```json
{
  "current_date": "2020-01-01T00:00:00Z",
  "thread_tweets": [
    {
      "tweet_id": "123456789",
      "author": "@Dexerto",
      "date": "2019-11-20T23:09:00Z",
      "text": "Could @DisguisedToast be the next big Twitch streamer to leave the platform? 👀"
    }
  ],
  "target_slices": [{ "text": "@DisguisedToast be the next big Twitch streamer to leave the platform" }],
  "timeframe_slices": [{ "text": "next" }],
  "timeframe_parsed": {
    "start_utc": "2019-11-20T23:09:00Z",
    "end_utc": "2019-12-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "News organization asking a speculative question about DisguisedToast potentially leaving Twitch.",
  "is_valid": false,
  "failure_cause": "OTHER",
  "confidence": 0.96,
  "reasoning": "This is phrased as a question ('Could @DisguisedToast be...?'), not a statement or prediction. Questions are inherently speculative and non-committal. The author is asking readers to speculate, not making their own prediction. Even rhetorical questions do not constitute predictions."
}
```

### Example 13: Invalid - Question (Speculative)

**Input:**

```json
{
  "current_date": "2020-01-01T00:00:00Z",
  "thread_tweets": [
    {
      "tweet_id": "987654321",
      "author": "@Dexerto",
      "date": "2019-01-09T09:06:00Z",
      "text": "Updated list of all Fortnite Battle Royale world records 🏅 Will these records be broken in 2019?"
    }
  ],
  "target_slices": [{ "text": "these records be broken" }],
  "timeframe_slices": [{ "text": "in 2019" }],
  "timeframe_parsed": {
    "start_utc": "2019-01-09T09:06:00Z",
    "end_utc": "2019-12-31T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "News organization sharing Fortnite world records and asking if they'll be broken.",
  "is_valid": false,
  "failure_cause": "OTHER",
  "confidence": 0.97,
  "reasoning": "This ends with a question: 'Will these records be broken in 2019?' Questions are not predictions - they're inviting speculation, not making a statement. The author is not predicting that records will or won't be broken, they're asking the audience."
}
```

### Example 14: Invalid - Quoting Others

**Input:**

```json
{
  "current_date": "2019-12-31T00:00:00Z",
  "thread_tweets": [
    {
      "tweet_id": "111222333",
      "author": "@Dexerto",
      "date": "2019-08-28T05:40:00Z",
      "text": "LoL shoutcaster claims that favorite team to win #Worlds2019 'will get exploited.'"
    }
  ],
  "target_slices": [{ "text": "favorite team to win #Worlds2019 will get exploited" }],
  "timeframe_slices": [{ "text": "#Worlds2019" }],
  "timeframe_parsed": {
    "start_utc": "2019-08-28T05:40:00Z",
    "end_utc": "2019-11-10T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "News organization reporting on a League of Legends shoutcaster's prediction about Worlds 2019.",
  "is_valid": false,
  "failure_cause": "QUOTING_OTHERS",
  "confidence": 0.98,
  "reasoning": "The text states 'LoL shoutcaster claims that...' - this is clearly attributing the prediction to someone else (the shoutcaster), not making their own prediction. Dexerto is reporting on what the shoutcaster said, not making their own prediction. Even if the shoutcaster's prediction comes true, Dexerto wasn't the one making the prediction."
}
```

### Example 15: Invalid - Trivial/Obvious Outcome

**Input:**

```json
{
  "current_date": "2019-07-28T00:00:00Z",
  "thread_tweets": [
    {
      "tweet_id": "444555666",
      "author": "@Dexerto",
      "date": "2019-07-25T09:43:00Z",
      "text": "Top 20 highest earning #fortnite players ahead of the $30 million World Cup 🏆 This list will change a lot this weekend 🤑"
    }
  ],
  "target_slices": [{ "text": "This list will change a lot" }],
  "timeframe_slices": [{ "text": "this weekend" }],
  "timeframe_parsed": {
    "start_utc": "2019-07-25T09:43:00Z",
    "end_utc": "2019-07-28T23:59:59Z"
  }
}
```

**Output:**

```json
{
  "context": "News organization noting that the highest earning Fortnite players list will change during the World Cup tournament.",
  "is_valid": false,
  "failure_cause": "OTHER",
  "confidence": 0.94,
  "reasoning": "This is stating an obvious outcome: of course the earnings list will change during a $30 million tournament happening this weekend. There's no meaningful uncertainty here - this is virtually guaranteed. This is an observation about obvious causality ('big tournament = earnings change'), not a prediction requiring insight or analysis. Trivial outcomes are not meaningful predictions."
}
```
