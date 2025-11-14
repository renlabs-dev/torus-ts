# KaitoTwitterAPI Client

A comprehensive TypeScript client for the [KaitoTwitterAPI](https://docs.twitterapi.io/) service with full type safety, Zod validation, and modern async/await support.

## Features

- 🚀 **Full TypeScript Support** - Complete type safety with Zod schema validation
- 🔄 **Automatic Retries** - Exponential backoff retry logic for failed requests
- 📄 **Pagination Support** - Easy cursor-based pagination for large datasets
- 🛡️ **Error Handling** - Comprehensive error handling with custom error classes
- 📊 **Rate Limit Aware** - Built-in rate limit detection and handling
- 🧪 **Well Tested** - Robust validation and error handling

## Installation

The client is already included in this package with `ky` and `zod` dependencies.

## Quick Start

```ts
import { KaitoTwitterAPI } from "./twitterapi-io";

// Initialize the client
const client = new KaitoTwitterAPI({
  apiKey: "your-api-key-here",
});

// Get user information
const user = await client.users.getInfo({ userName: "elonmusk" });
console.log(`${user.name} has ${user.followers} followers`);
```

## Authentication & Actions

For actions that require authentication (posting tweets, following users, etc.), you need to login first:

```ts
// Login to get authentication cookie
const loginResponse = await client.actions.login({
  user_name: "your_username",
  email: "your@email.com",
  password: "your_password",
  proxy: "http://username:password@proxy-host:port",
  totp_secret: "your_2fa_secret", // optional
});

const { login_cookie } = loginResponse;

// Create a tweet
const tweet = await client.actions.createTweet({
  text: "Hello from KaitoTwitterAPI! 🚀",
  login_cookie,
});

// Follow a user
await client.actions.followUser({
  user_name: "twitter",
  login_cookie,
});

// Like a tweet
await client.actions.likeTweet({
  tweet_id: "1234567890123456789",
  login_cookie,
});
```

## User Operations

```ts
// Get user info by username
const user = await client.users.getInfo({ userName: "jack" });

// Get user's followers (200 per page)
const followers = await client.users.getFollowers({
  userName: "jack",
  cursor: "optional_cursor_for_pagination",
});

// Search users by keyword
const searchResults = await client.users.search({
  keyword: "developer",
  limit: 10,
});

// Check follow relationship
const relationship = await client.users.checkFollowRelationship({
  sourceUserName: "user1",
  targetUserName: "user2",
});
```

## Tweet Operations

```ts
// Get tweets by IDs
const tweets = await client.tweets.getByIds({
  tweetIds: ["1234567890123456789", "9876543210987654321"],
});

// Get tweet replies
const replies = await client.tweets.getReplies({
  tweetId: "1234567890123456789",
  cursor: "optional_cursor",
});

// Advanced tweet search
const searchResults = await client.tweets.advancedSearch({
  query: "typescript OR javascript",
  queryType: "Latest",
});

// Get thread context
const thread = await client.tweets.getThreadContext({
  tweetId: "1234567890123456789",
});
```

## Error Handling

The client provides specific error classes for different scenarios:

```ts
import {
  KaitoAuthenticationError,
  KaitoRateLimitError,
  KaitoTwitterAPIError,
  KaitoValidationError,
} from "./twitterapi-io";

try {
  const user = await client.users.getInfo({ userName: "nonexistent" });
} catch (error) {
  if (error instanceof KaitoAuthenticationError) {
    console.error("Authentication failed:", error.message);
  } else if (error instanceof KaitoRateLimitError) {
    console.error("Rate limited. Retry after:", error.retryAfter);
  } else if (error instanceof KaitoValidationError) {
    console.error("Invalid data:", error.validationErrors);
  } else if (error instanceof KaitoTwitterAPIError) {
    console.error("API error:", error.message, "Status:", error.status);
  }
}
```

## Pagination

Most endpoints support cursor-based pagination:

```ts
let cursor: string | undefined;
const allFollowers = [];

do {
  const page = await client.users.getFollowers({
    userName: "jack",
    cursor,
  });

  allFollowers.push(...page.data);
  cursor = page.cursor;
} while (cursor);

console.log(`Total followers collected: ${allFollowers.length}`);
```

## Configuration

```ts
const client = new KaitoTwitterAPI({
  apiKey: "your-api-key",
  baseURL: "https://api.twitterapi.io", // optional, defaults to official URL
  timeout: 30000, // optional, defaults to 30 seconds
  retryConfig: {
    // optional, customize retry behavior
    limit: 3,
    methods: ["get", "post"],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    backoffLimit: 3000,
  },
});
```

## Health Check

```ts
const isHealthy = await client.healthCheck();
console.log("API Status:", isHealthy ? "OK" : "Error");
```

## TypeScript Support

All methods return properly typed data based on the API responses:

```ts
// User type is automatically inferred
const user: User = await client.users.getInfo({ userName: "jack" });

// Tweet type is automatically inferred
const tweets: Tweet[] = await client.tweets.getByIds({
  tweetIds: ["123"],
});

// Pagination type is inferred
const followers: CursorPagination<SimpleUser> = await client.users.getFollowers(
  {
    userName: "jack",
  },
);
```

## Full API Documentation

Complete API documentation is available locally:

- **Scraped Documentation**: [`/docs/kaito-twitterapi-io/`](/docs/kaito-twitterapi-io/)
- **API Reference Guide**: [`/docs/kaito-twitterapi-io/api-reference/`](/docs/kaito-twitterapi-io/api-reference/)

See [CLAUDE.md](./CLAUDE.md) for implementation details and development notes.

For the official online documentation, visit [https://docs.twitterapi.io/](https://docs.twitterapi.io/).
