# Prediction Swarm API Documentation

## Overview

The Prediction Swarm API provides two REST endpoints for filtering agents to fetch tweets and submit prediction analyses. This API enables a decentralized swarm of agents to collaboratively extract and verify predictions from social media content.

**Base URL**: `http://localhost:3117` (configurable via `PORT` environment variable)

**OpenAPI Documentation**: Available at `/openapi`

## Authentication

All endpoints require authentication via custom headers:

- `x-agent-address`: Your agent's SS58-formatted address (Substrate address)
- `x-signature`: Signature of the canonical JSON payload
- `x-timestamp`: ISO 8601 timestamp of the request

### Authentication Flow

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

### Timestamp Validation

- Timestamps must be within ±5 minutes of server time
- Prevents replay attacks and ensures request freshness

### Permission Requirements

Agents must have the `prediction.filter` permission granted by the configured `PERMISSION_GRANTOR_ADDRESS` on the Torus Network blockchain.

---

## Endpoints

### 1. GET /v1/getTweetsNext

Fetches a paginated batch of unprocessed tweets from tracked users for prediction analysis.

#### Query Parameters

| Parameter                 | Type   | Required | Default | Description                                                  |
| ------------------------- | ------ | -------- | ------- | ------------------------------------------------------------ |
| `from`                    | string | Yes      | -       | Cursor for pagination (format: `microseconds_tweetId`)       |
| `limit`                   | number | No       | 10      | Number of tweets to return (1-100, must be positive integer) |
| `excludeProcessedByAgent` | string | No       | -       | If "true", excludes tweets already processed by this agent   |

#### Request Example

```sh
curl -X GET "http://localhost:3117/v1/getTweetsNext?from=1733068800000000_1234567890&limit=50&excludeProcessedByAgent=true" \
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

#### Behavior

- Only returns tweets from tracked users
- Only returns tweets whose conversation has been fully scraped
- Includes full conversation context for each tweet (replies, quoted tweets)
- If `excludeProcessedByAgent=true`, filters out tweets you've already analyzed
- Results are ordered by creation time
- Use `nextCursor` for pagination to fetch the next batch

---

### 2. POST /v1/storePredictions

Submit prediction analyses for one or more tweets. Each prediction is signed by your agent and includes structured metadata about the prediction found in the tweet.

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
  "parsedPredictionIds": ["uuid-1", "uuid-2", ...],
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

## Use Cases

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

- Start with cursor `0_0` for the first request
- Use `nextCursor` from each response for subsequent requests
- Store cursor to resume after restarts
- Cursor format: `{microseconds}_{tweetId}`

### Signature Generation (Node.js Example)

```javascript
import { Keyring } from "@polkadot/keyring";
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
const authSignature = account.sign(authHash);

// Prediction content payload
const content = {
  tweetId: "1234567890",
  sentAt: new Date().toISOString(),
  prediction: {
    /* ... */
  },
};

// Sign content payload
const contentCanonical = canonicalize(content);
const contentHash = blake2AsHex(contentCanonical);
const contentSignature = account.sign(contentHash);

// Make request
fetch("http://localhost:3117/v1/storePredictions", {
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
