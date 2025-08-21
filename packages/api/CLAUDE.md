# tRPC API Testing Guide

## Calling tRPC Query Procedures via HTTP

When testing tRPC query procedures directly via HTTP, the input must be wrapped in a `json` property.

### Correct Format

```bash
curl -G "http://localhost:3004/api/trpc/permission.streamEmissionsInTimeframe" \
  --data-urlencode 'input={"json":{"accountId":"5D5FbRRUvQxdQnJLgNW6BdgZ86CRGreKRahzhxmdSj2REBnt","timeframe":{"startBlock":2186610,"endBlock":2187610}}}'
```

### Input Structure

The input parameter should be structured as:

```json
{
  "json": {
    "accountId": "...",
    "timeframe": {...}
  }
}
```

**NOT:**
```json
{
  "accountId": "...", 
  "timeframe": {...}
}
```

### Using Node.js

```javascript
const fetch = require('node-fetch');

const url = 'http://localhost:3004/api/trpc/permission.streamEmissionsInTimeframe';
const queryParams = new URLSearchParams();
queryParams.append('input', JSON.stringify({
  json: {
    accountId: '5D5FbRRUvQxdQnJLgNW6BdgZ86CRGreKRahzhxmdSj2REBnt',
    timeframe: {
      startBlock: 2186610,
      endBlock: 2187610
    }
  }
}));

const response = await fetch(url + '?' + queryParams.toString());
const result = await response.json();
```

### Important Notes

- Query procedures use GET requests, not POST
- The `json` wrapper is required for all tRPC query procedures
- Use proper URL encoding for query parameters
- This format works for both local development and deployed environments