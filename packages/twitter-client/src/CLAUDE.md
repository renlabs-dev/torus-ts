# KaitoTwitterAPI Client Documentation

## Overview

TypeScript client for the KaitoTwitterAPI service with full type safety, Zod validation, and retry logic.

## Documentation

### API Documentation

Complete API documentation has been scraped and organized locally:

- **Full Documentation**: `/docs/kaito-twitterapi-io/`
- **API Reference**: `/docs/kaito-twitterapi-io/api-reference/`
- **Official Docs**: <https://docs.twitterapi.io/>

### Quick Links

- [Introduction & Overview](/docs/kaito-twitterapi-io/introduction.md)
- [Authentication Guide](/docs/kaito-twitterapi-io/authentication.md)
- [API Reference Index](/docs/kaito-twitterapi-io/api-reference/index.md)

## Client Implementation

### Directory Structure

- `client.ts` - Main KaitoTwitterAPI client class
- `kaito-client.ts` - Base HTTP client with retry logic
- `endpoints/` - Endpoint implementations (users, tweets, actions)
- `schemas/` - Zod schemas for validation
- `utils/` - Helper utilities
- `__tests__/` - Test files

### Key Features

- Full TypeScript support with Zod validation
- Automatic retry with exponential backoff
- Rate limit handling
- Cursor-based pagination
- Comprehensive error handling

### Error Types

- `KaitoTwitterAPIError` - Base API error
- `KaitoAuthenticationError` - Authentication failures
- `KaitoRateLimitError` - Rate limit exceeded
- `KaitoValidationError` - Data validation errors

### Endpoint Categories

- **Users**: User profiles, followers, followings, search
- **Tweets**: Tweet data, replies, quotes, search
- **Actions**: Create/delete tweets, follow/unfollow, like/unlike (requires login)
- **Communities**: Community management and data
- **Lists**: Twitter list functionality
- **Monitoring**: Real-time tweet monitoring and webhooks

## Testing

Tests are in `__tests__/` directory with integration tests for the API client.
Run with: `just test-twitterapi`

## Configuration

```ts
const client = new KaitoTwitterAPI({
  apiKey: "your-api-key",
  baseURL: "https://api.twitterapi.io", // optional
  timeout: 30000, // optional
  retryConfig: {
    // optional
    limit: 3,
    methods: ["get", "post"],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    backoffLimit: 3000,
  },
});
```

## Authentication for Actions

For endpoints that require login (posting tweets, following users, etc.):

```ts
// Login first to get authentication cookie
const loginResponse = await client.actions.login({
  user_name: "username",
  email: "email@example.com",
  password: "password",
  totp_secret: "2FA_secret", // optional
});

const { login_cookie } = loginResponse;

// Use cookie for authenticated actions
await client.actions.createTweet({
  text: "Hello world!",
  login_cookie,
});
```

## Extra

### Twitter Advanced Search

Docs for Twitter Advanced Search operators:

<https://github.com/igorbrigadir/twitter-advanced-search>

## Notes

- API key required from <https://twitterapi.io/dashboard>
- Login cookie needed for action endpoints (tweet, follow, like, etc.)
- Rate limits: Up to 200 QPS per client
- Pricing: $0.15/1k tweets, $0.18/1k users, minimum $0.00015/request
- Average response time: 700ms
- Proven with over 1M API calls

## Related Files

- See [README.md](./README.md) for usage examples and quick start guide
- Complete API documentation in `/docs/kaito-twitterapi-io/`
