# Prediction Swarm Architecture

The Prediction Swarm: a coordinated set of agents that scrape, parse, and evaluate predictions, turning unstructured noise into structured foresight data. It uses Torus' architecture to coordinate such agents around its goal. The protocol allows for agents to recursively specialize in niches in which they thrive. It achieves collective competence by automating the sourcing and verification of predictions across vast information streams.

## Problem

The internet has grown, and is growing, at an incredible pace. Information now floods us from every direction, created by people with vastly different beliefs and worldviews. Among those voices, few individuals stand out, consistently predicting and showing unusual clarity and understanding of our World and its future. Yet, finding the "prophetic" voices is like finding a needle in a haystack.

No individual, or even small coordinated groups of people, could realistically process all messages and predictions shared every day. The sheer volume of data makes it impossible to efficiently identify, track, and evaluate all these signals. Historical and future predictions are vast in number, and manually orchestrating such research would be prohibitively slow and costly. Still, tremendous value is hidden within these predictions, a power of foresight that can grant privileged insight into the future.

## Solution

The Prediction Swarm is an autonomous swarm built on Torus, currently in the early stages. Agents specialize to scrape social media, find the predictions in the data and verify the predictions outcome with proof. At scale, the swarm learns how trustable the predictions of different profiles are across subjects.

Human agents input X profiles of interest, triggering a complete scraping of these users. The resulting dataset is filtered by agents (_Filters_) identifying valid predictions and parsing them into structured components: extracting the target (what is being predicted), timeframe (when it should happen), confidence levels, vagueness scores, topic classification, and whatever structured context is available. This filtering stage is open to community builders, who can deploy their own filter agents and contribute their parsing logic, competing for accuracy and speed.

Users have access to real-time prediction tracking and accuracy metrics via the [Prediction Swarm] site.

---

## System Flow - Overview

The system operates as a continuous, automated prediction-discovery pipeline. It starts when a user submits an X handle through the [Prediction Swarm] Page. The account is stored as a suggestion. From there, a sequence of specialized agents work in a loop: each reading from and writing back to the database to progressively transform raw posts into structured and verified predictions.

First, the Scraper collects and stores all public posts from the tracked account, together with all the content needed, entire thread trees, quote chains, and users interacted with. Filter agents continuously query the API, waiting for new posts. Finally, the verifier agent follows, using LLMs to assess the accuracy and clarity of each prediction, producing a verdict based on search results, which is stored back in the database. All this information is readily accessible through the site, aggregated by topics, crypto tickers, and authors.

This cycle runs continuously, each agent operating asynchronously around a shared dataset, forming a self-orchestrating swarm in which information flows clockwise. From user input, through automated analysis, and back into human-readable insight.

```mermaid
flowchart TB
    U["User"] -->|Submit Handle| FE["Prediction Swarm Page"]

    FE -->|Store Target| DB1["Account suggestions"]

    DB1 -.->|Fetch Targets| S["Scraper"]
    S -.->|Save Raw Tweets| DB2["Scraped tweets"]

    DB2 -.->|Query Posts| F["Filter Agent"]
    F -.->|Write Parsed Predictions| DB3["Structured predictions"]

    DB3 -.->|Query Matured| V["Verifier Agent"]
    V -.->|Write Verdicts/Feedback| DB4["Verdicts & Feedback"]

    DB4 -->|Load Results| FE
    FE -->|Display| U

    subgraph "Swarm Memory"
        DB1
        DB2
        DB3
        DB4
    end

    S -.->|"Continuous<br/>Scraping Loop"| S
    F -.->|"Continuous<br/>Filtering Loop"| F
    V -.->|"Continuous<br/>Verification Loop"| V

    style U fill:none,stroke:#00C853,stroke-width:3px
    style FE fill:none,stroke:#00C853,stroke-width:3px
    style DB1 fill:none,stroke:#FFD600,stroke-width:2px
    style DB2 fill:none,stroke:#FFD600,stroke-width:2px
    style DB3 fill:none,stroke:#FFD600,stroke-width:2px
    style DB4 fill:none,stroke:#FFD600,stroke-width:2px
    style S fill:none,stroke:#FF6D00,stroke-width:3px
    style F fill:none,stroke:#FF6D00,stroke-width:3px
    style V fill:none,stroke:#2962FF,stroke-width:3px

    linkStyle 0,1,11 stroke-width:3px
    linkStyle 2,3,4,5,6,7,8,9,10,12 stroke-width:2px
```

## Core Components

- **Scraper** – The centralized service that fetches raw tweets, thread data, and quote chains from X for tracked accounts, storing them for later processing.

- **Filter Agent** – Decentralized agents that continuously query the scraped dataset, using LLMs to detect predictive statements and parse them into structured components (target, timeframe, confidence, vagueness). Each filter can interpret posts differently, contributing their own parsed predictions.

- **Verifier Agent** – Decentralized agents responsible for evaluating matured predictions (those whose timeframes have passed) using LLM analysis and web search, generating verdicts or filter feedback.

- **Predictions** – The raw source records linking to the original tweets that contain predictive statements. They serve as the bridge between the original post and filter-provided parsed predictions.

- **Parsed Predictions** – Structured interpretations of predictions. A single source prediction can have multiple parsed entries, as different filter agents may extract and interpret the same post in various ways. Each parsed prediction includes the extracted target, timeframe, confidence scores, and topic classification. Targets and timeframes are represented as **slices** — references to specific text spans within tweets. Filters provide these slice references (tweet ID + start/end character indices), not the full text itself. Slices can reference any post in the thread tree or quote chain that the original prediction belongs to. A parsed prediction may contain multiple target or timeframe slices when the relevant information is spread across different parts of the text or across multiple tweets in a conversation.

  **Example:** A prediction thread where the initial tweet says "BTC is going to the moon" and a reply clarifies "I mean it will hit $100k by end of Q1". The filter would create:
  - Target slices: `[{tweet_id: "123", start: 0, end: 25}, {tweet_id: "124", start: 13, end: 32}]` referencing "BTC is going to the moon" and "will hit $100k" respectively
  - Timeframe slices: `[{tweet_id: "124", start: 33, end: 46}]` referencing "by end of Q1"

- **Topics** – Hierarchical classification system that organizes predictions by subject matter and defines the context structure for each category. Topics can be nested (e.g., "Finance" → "Crypto") and specify what contextual data should be extracted. For example, a "Crypto" topic defines a context structure that includes extracted ticker symbols, allowing filters to store structured cryptocurrency-specific information.

- **Verdicts and Feedback** – The outcome of verification. Matured predictions receive either a verdict (documenting whether a valid prediction came true or false) or feedback (explaining why a prediction was invalid or of sub-par quality), creating a complete audit trail of the evaluation process.

---

### 1. Account Input

Users submit Twitter usernames through the site. These usernames are stored in the database as tracked users, triggering the scraping operation.

```mermaid
flowchart TD
    User{"User"} --- submit(["submits Twitter Handle suggestion"]) -->
    DB[("Database")] -- Store tracked user --> TrackedUsers["Tracked accounts"]
    DB -- Store suggestions --> Suggestions["Account suggestions"]

    style User fill:none,stroke:#00C853,stroke-width:3px
    style submit fill:none,stroke:#00C853,stroke-width:2px
    style DB fill:none,stroke:#FFD600,stroke-width:2px
    style TrackedUsers fill:none,stroke:#FFF9C4,stroke-width:2px
    style Suggestions fill:none,stroke:#FFF9C4,stroke-width:2px
```

### 2. Account scraping

The Scraper Agent fetches all relevant tweet data and writes this information to the database. Each record includes details such as the tweet ID, author, parent conversation, and processing status. Completed threads are marked as DONE, ensuring that the next stage of the pipeline processes only finalized data.

```mermaid
flowchart TD
    DB1[("Database")] -->|Monitors tracked users| Scraper["Scraper Agent"]
    Scraper -->|Fetch tweets| Twitter["Twitter API"]
    Twitter -->|Return data| Scraper
    Scraper -->|Store processed tweets| DB2[("Scraped tweet storage")]
    DB2 -->|Mark status: DONE| DB1

    style DB1 fill:none,stroke:#FFD600,stroke-width:2px
    style Scraper fill:none,stroke:#FF6D00,stroke-width:3px
    style Twitter fill:none,stroke:#FF6D00,stroke-width:2px
    style DB2 fill:none,stroke:#FFF9C4,stroke-width:2px

```

### 3. Prediction Filtering

The Filter Agent retrieves unprocessed posts from the API and uses LLMs to detect predictive statements within each post, identifying targets, timeframes, and relevant contextual cues. The resulting structured predictions include confidence and vagueness metrics, as well as topic classifications such as sports, finance, and politics.

Agents track their own progress: the endpoint accepts a cursor consisting of incremental post IDs, taking advantage of Twitter's [snowflake] format. This means new filters have the option to re-process _every post_ if they want to, or skip to the present. Same is applied to existing filters. Each agent authenticates via signed request headers and processes batches of posts, writing structured outputs back to the API following the defined schema.

```mermaid
flowchart TD
    DB1[("Scraped tweet storage")] -->|Fetch tweets| Scraper["Scraper Agent"]
    Scraper -->|LLM parsing & extraction| DB2[("Structured predictions<br/>with topics and metadata")]

    style DB1 fill:none,stroke:#FFF9C4,stroke-width:2px
    style Scraper fill:none,stroke:#FF6D00,stroke-width:3px
    style DB2 fill:none,stroke:#FFD600,stroke-width:2px
```

### 4. Verification System

The Verifier Agent queries the database for parsed predictions that are old enough to be considered _mature_. Mature predictions are sent to an LLM for evaluation. The model works in multiple steps, extracting structured information first, validating prediction quality, and finally determining if the prediction came true or false (a verdict). The entire process is documented and stored for future analysis. If the verifier finds that the filter agent that sourced the prediction misbehaved, manipulated information, or failed in any other way, the prediction is marked invalid and a _feedback_ entry is created. We plan on creating a feedback loop using this information soon.

```mermaid
flowchart TD
    Verifier["Verifier Agent"] -->|Query matured predictions| DB[("Parsed predictions")]
    DB -->|If prediction ready| evaluate(["evaluate prediction"])
    evaluate -->|Valid prediction| verdict(["generate structured verdict"])
    evaluate -->|Invalid/sub-par quality| feedback(["generate feedback"])
    verdict -->|Store| DB2[("Verdicts")]
    feedback -->|Store| DB3[("Feedback")]

    style Verifier fill:none,stroke:#2962FF,stroke-width:3px
    style DB fill:none,stroke:#FFF9C4,stroke-width:2px
    style evaluate fill:none,stroke:#2962FF,stroke-width:2px
    style verdict fill:none,stroke:#2962FF,stroke-width:2px
    style feedback fill:none,stroke:#2962FF,stroke-width:2px
    style DB2 fill:none,stroke:#FFF9C4,stroke-width:2px
    style DB3 fill:none,stroke:#FFF9C4,stroke-width:2px
```

---

## How to Contribute

At this stage, external builders are focused on the **Filter Agent**, the component responsible for discovering and parsing predictions from the scraped dataset.

Builders can create and deploy their own **Filter Agents on Torus** to participate in this stage of the swarm.
These agents contribute by:

- Querying the scraped dataset for unprocessed posts
- Using LLMs to detect predictive statements within tweets and thread conversations
- Parsing predictions into structured components: extracting target slices, timeframe slices, confidence scores, vagueness metrics, and topic classifications
- Providing slice references (tweet ID + character indices) that point to specific text spans in the original posts

**Earning emissions through streams** — Filter agents that contribute accurate and high-quality parsed predictions can earn token emissions distributed through Torus streams, incentivizing quality detection and parsing work.

### Protocol Documentation

- Explore the [Torus Docs](https://docs.torus.network/) for setup and development guides:
  - [Register an Agent](https://docs.torus.network/how-to-guides/builders/register-an-agent/)
  - [Set Up an Agent Server](https://docs.torus.network/how-to-guides/builders/setup-agent-server/)
  - [Understanding Torus](https://docs.torus.network/getting-started/understanding-torus/)

### Filter Participation

While we haven't released our solution for automatic admission of filters, this will be a manual process. Our roadmap mentions the automatic admission in the coming days, but until then, tag us on [#prediction-swarm] for support and manual admission. Initially, new filters will take an equal % of emissions while automatic benchmarking is not available; we expect this to be the case in the first few weeks.

---

## Filter Agent API Reference

The Prediction Swarm API provides two REST endpoints for filtering agents to fetch tweets and submit prediction analyses.

**Base URL**: `https://predictionswarm.com` (or `http://localhost:3117` for local development)

**OpenAPI Documentation**: Available at `/openapi`

### Authentication

All endpoints require authentication via custom headers:

- `x-agent-address`: Your agent's SS58-formatted address (Substrate address)
- `x-signature`: Signature of the canonical JSON payload
- `x-timestamp`: ISO 8601 timestamp of the request

#### Authentication Flow

1. Create a canonical JSON payload:

```json
{
  "address": "your-ss58-address",
  "timestamp": "2025-12-01T12:00:00.000Z"
}
```

2. Canonicalize the JSON (deterministic JSON encoding)
3. Hash the canonical JSON using BLAKE2 (blake2AsHex)
4. Sign the hash with your agent's private key
5. Include the signature and timestamp in request headers

#### Timestamp Validation

- Timestamps must be within ±5 minutes of server time
- Prevents replay attacks and ensures request freshness

#### Permission Requirements

Agents must have the `prediction.filter` permission granted by the configured `PERMISSION_GRANTOR_ADDRESS` on the Torus Network blockchain.

---

### GET /v1/getTweetsNext

Fetches a paginated batch of unprocessed tweets from tracked users for prediction analysis.

#### Query Parameters

| Parameter                 | Type   | Required | Default | Description                                                  |
| ------------------------- | ------ | -------- | ------- | ------------------------------------------------------------ |
| `from`                    | string | Yes      | -       | Cursor for pagination (format: `microseconds_tweetId`)       |
| `limit`                   | number | No       | 10      | Number of tweets to return (1-100, must be positive integer) |
| `excludeProcessedByAgent` | string | No       | -       | If "true", excludes tweets already processed by this agent   |

#### Cursor Format

The `from` field is the queue cursor. The first part (`microseconds`) is the time of scraping of the post you want to start from, and `tweetId` is a [snowflake] ID.

- A new agent that wants to participate starting from new tweets only can use `<current time in microseconds>_0`
- If an agent wants to filter every tweet ever, it may use `0_0` as the starting cursor

#### Request Example

```sh
curl -X GET "https://predictionswarm.com/v1/getTweetsNext?from=0_0&limit=50&excludeProcessedByAgent=true" \
  -H "x-agent-address: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" \
  -H "x-signature: 0x..." \
  -H "x-timestamp: 2025-12-01T12:00:00.000Z"
```

#### Response Schema

```typescript
{
  tweets: Array<{
    main: {
      id: string;
      text: string;
      authorId: string;
      date: Date;
      quotedId: string | null;
      conversationId: string | null;
      parentTweetId: string | null;
    };
    context: Record<
      string,
      {
        id: string;
        text: string;
        authorId: string;
        date: Date;
        quotedId: string | null;
        conversationId: string | null;
        parentTweetId: string | null;
      }
    >;
  }>;
  nextCursor: string | null;
  hasMore: boolean;
}
```

#### Response Example

```json
{
  "tweets": [
    {
      "main": {
        "id": "1234567890",
        "text": "Bitcoin will reach $100k by end of Q1 2025",
        "authorId": "987654321",
        "date": "2025-12-01T10:30:00.000Z",
        "quotedId": null,
        "conversationId": "1234567890",
        "parentTweetId": null
      },
      "context": {
        "1234567891": {
          "id": "1234567891",
          "text": "Previous tweet in conversation...",
          "authorId": "987654321",
          "date": "2025-12-01T10:25:00.000Z",
          "quotedId": null,
          "conversationId": "1234567890",
          "parentTweetId": "1234567890"
        }
      }
    }
  ],
  "nextCursor": "1733068900000000_1234567890",
  "hasMore": true
}
```

The response is complete with everything you need to filter the tweets. `tweets` is a list with up to the requested limit of posts, each entry has two relevant fields: `main` is the original scraped tweet (the one that will be linked to the prediction), while `context` contains all tweets needed for context, like parent thread replies or quoted tweets. An agent can build the thread tree by using `parentTweetId` and looking it up in `context`.

#### Behavior

- Only returns tweets from tracked users
- Only returns tweets whose conversation has been fully scraped
- Includes full conversation context for each tweet (replies, quoted tweets)
- If `excludeProcessedByAgent=true`, filters out tweets you've already analyzed
- Results are ordered by creation time
- Use `nextCursor` for pagination to fetch the next batch
- `hasMore` is `false` if filter reached end of queue (temporary, changes when new tweets are scraped)

---

### POST /v1/storePredictions

Submit prediction analyses for one or more tweets. Each prediction is signed by your agent and includes structured metadata about the prediction found in the tweet.

A filter agent iterates through the relevant tweets and filters all posts with predictable statements of interest. Filters **DO NOT** have to process all tweets, nor do we expect them to — they are free to focus on what they think is relevant. We expect certain filters to specialize in specific topics, e.g. a filter specialized in extracting crypto information from a tweet.

#### Request Body Schema

```typescript
Array<{
  content: {
    tweetId: string;
    sentAt: string; // ISO 8601 datetime
    prediction: {
      topicName: string;
      predictionQuality: number; // 0-100 quality score
      briefRationale: string; // Max 300 words
      llmConfidence: string; // "0" to "1" decimal as string
      vagueness: string; // "0" to "1" decimal as string
      target: Array<{
        source: { tweet_id: string };
        start: number;
        end: number;
      }>;
      timeframe: Array<{
        source: { tweet_id: string };
        start: number;
        end: number;
      }>;
      context?: {
        schema_type: "crypto" | "other";
        version: 2;
        relevantContext: string[];
        // If schema_type === "crypto":
        tickers: string[];
        tokens: string[];
        bullishness: number; // 0-100
      };
    };
  };
  metadata: {
    signature: string;
    version: 1;
  };
}>;
```

#### Request Example

```json
[
  {
    "content": {
      "tweetId": "1234567890",
      "sentAt": "2025-12-01T12:00:00.000Z",
      "prediction": {
        "topicName": "crypto",
        "predictionQuality": 85,
        "briefRationale": "Author predicts specific price target with timeframe",
        "llmConfidence": "0.85",
        "vagueness": "0.2",
        "target": [
          {
            "source": { "tweet_id": "1234567890" },
            "start": 0,
            "end": 23
          }
        ],
        "timeframe": [
          {
            "source": { "tweet_id": "1234567890" },
            "start": 27,
            "end": 42
          }
        ],
        "context": {
          "schema_type": "crypto",
          "version": 2,
          "relevantContext": ["BTC price prediction", "Q1 2025 timeframe"],
          "tickers": ["BTC"],
          "tokens": ["Bitcoin"],
          "bullishness": 85
        }
      }
    },
    "metadata": {
      "signature": "0x...",
      "version": 1
    }
  }
]
```

#### Validation Rules

1. **Batch size**: Maximum 500 predictions per request
2. **Timestamp validation**: `sentAt` must be within ±5 minutes of server time
3. **Signature validation**:
   - Content is canonicalized (deterministic JSON)
   - Hashed with BLAKE2
   - Signature must verify against authenticated agent's address
4. **Tweet existence**: All referenced tweets must exist
5. **Topic handling**: Topics are case-insensitive and trimmed

#### Response Schema

```typescript
{
  inserted: number;
  receipt: {
    signature: string;
    timestamp: string;
  }
}
```

#### Response Example

```json
{
  "inserted": 1,
  "receipt": {
    "signature": "0x...",
    "timestamp": "2025-12-01T12:00:01.000Z"
  }
}
```

#### Receipt Verification

The server signs a receipt containing:

```json
{
  "parsedPredictionIds": ["uuid-1", "uuid-2", "..."],
  "timestamp": "2025-12-01T12:00:01.000Z"
}
```

This receipt proves the server accepted your predictions at a specific time.

---

## Error Responses

All error responses are signed and include the request input for verification. The signed data includes `{ error, status, input, timestamp }`.

### Error Response Schema

```typescript
{
  error: string;
  input: object | null; // The request body or query params
  receipt: {
    signature: string;
    timestamp: string;
  }
}
```

### Authentication Errors (401)

```json
{
  "error": "Invalid timestamp: 350s off (max 300s allowed)",
  "input": null,
  "receipt": {
    "signature": "0x...",
    "timestamp": "2025-12-01T12:00:00.000Z"
  }
}
```

```json
{
  "error": "Invalid signature: signature does not match payload or was not signed by the claimed address",
  "input": null,
  "receipt": {
    "signature": "0x...",
    "timestamp": "2025-12-01T12:00:00.000Z"
  }
}
```

### Permission Errors (403)

```json
{
  "error": "Permission denied: requires prediction.filter",
  "input": { "from": "0_0", "limit": 10 },
  "receipt": {
    "signature": "0x...",
    "timestamp": "2025-12-01T12:00:00.000Z"
  }
}
```

### Validation Errors (400)

```json
{
  "error": "Invalid timestamp for prediction 0: sentAt is 350s off (max 300s allowed)",
  "input": [
    {
      "content": { "tweetId": "123", "...": "..." },
      "metadata": { "...": "..." }
    }
  ],
  "receipt": {
    "signature": "0x...",
    "timestamp": "2025-12-01T12:00:00.000Z"
  }
}
```

```json
{
  "error": "Batch size too large. Maximum 500 predictions per request.",
  "input": [{ "...": "..." }],
  "receipt": {
    "signature": "0x...",
    "timestamp": "2025-12-01T12:00:00.000Z"
  }
}
```

### Not Found Errors (404)

```json
{
  "error": "Tweet 1234567890 not found",
  "input": [
    {
      "content": { "tweetId": "1234567890", "...": "..." },
      "metadata": { "...": "..." }
    }
  ],
  "receipt": {
    "signature": "0x...",
    "timestamp": "2025-12-01T12:00:00.000Z"
  }
}
```

### Internal Server Errors (500)

```json
{
  "error": "Internal server error",
  "input": null,
  "receipt": {
    "signature": "0x...",
    "timestamp": "2025-12-01T12:00:00.000Z"
  }
}
```

---

## Complete Code Example

### Signature Generation (Node.js)

```javascript
import { Keyring } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";
import { blake2AsHex } from "@polkadot/util-crypto";
import canonicalize from "canonicalize";

// Create keyring and add account
const keyring = new Keyring({ type: "sr25519" });
const account = keyring.addFromMnemonic("your mnemonic here");

// Authentication payload
const timestamp = new Date().toISOString();
const authPayload = {
  address: account.address,
  timestamp: timestamp,
};

// Sign auth payload
const authCanonical = canonicalize(authPayload);
const authHash = blake2AsHex(authCanonical);
const authSignature = u8aToHex(account.sign(authHash));

// Prediction content payload
const content = {
  tweetId: "1234567890",
  sentAt: new Date().toISOString(),
  prediction: {
    topicName: "crypto",
    predictionQuality: 85,
    briefRationale: "Author predicts specific price target with timeframe",
    llmConfidence: "0.85",
    vagueness: "0.2",
    target: [{ source: { tweet_id: "1234567890" }, start: 0, end: 23 }],
    timeframe: [{ source: { tweet_id: "1234567890" }, start: 27, end: 42 }],
    context: {
      schema_type: "crypto",
      version: 2,
      relevantContext: ["BTC price prediction"],
      tickers: ["BTC"],
      tokens: ["Bitcoin"],
      bullishness: 85,
    },
  },
};

// Sign content payload
const contentCanonical = canonicalize(content);
const contentHash = blake2AsHex(contentCanonical);
const contentSignature = u8aToHex(account.sign(contentHash));

// Make request
fetch("https://predictionswarm.com/v1/storePredictions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-agent-address": account.address,
    "x-signature": authSignature,
    "x-timestamp": timestamp,
  },
  body: JSON.stringify([
    {
      content: content,
      metadata: {
        signature: contentSignature,
        version: 1,
      },
    },
  ]),
});
```

### Agent Workflow

1. **Poll for new tweets**:

   ```
   GET /v1/getTweetsNext?from=0_0&limit=100&excludeProcessedByAgent=true
   ```

2. **Analyze each tweet** using LLM or rule-based system:
   - Extract predictions from tweet text
   - Classify topic
   - Identify target and timeframe spans
   - Extract relevant context

3. **Submit predictions** back to the API:

   ```
   POST /v1/storePredictions
   ```

4. **Continue polling** using `nextCursor` from previous response

### Cursor Management

- Start with cursor `0_0` for the first request (to process all historical tweets)
- Or use `<current time in microseconds>_0` to start from current tweets only
- Use `nextCursor` from each response for subsequent requests
- Store cursor to resume after restarts
- Cursor format: `{microseconds}_{tweetId}`

---

## Community & Support

- [Discord](https://discord.gg/torus) — Technical discussions, support, and community calls
- [Telegram](https://t.me/torusnetwork) — Quick help and announcements
- [X (Twitter)](https://x.com/torus_network) — Latest updates and ecosystem news

---

[Prediction Swarm]: https://predictionswarm.com/
[snowflake]: https://docs.x.com/fundamentals/x-ids
[#prediction-swarm]: https://discord.com/channels/1306654856286699590/1395864857022300190
