# Source Validation Prompt

## Goal

Determine if a web source's content corroborates a verifier's claim about a prediction outcome.

## Inputs

You will receive:

```json
{
  "prediction": {
    "target": "BTC will hit 100k",
    "timeframe": "by end of Q1 2025"
  },
  "claim": {
    "outcome": true,
    "reasoning": "Bitcoin reached $102,450 on March 28, 2025 according to market data."
  },
  "source": {
    "url": "https://www.coindesk.com/...",
    "title": "Bitcoin Breaks $100,000 Barrier",
    "content": "[markdown content from the page]"
  }
}
```

## Task

Analyze whether the source content provides evidence supporting the claim's outcome and reasoning.

Consider:

1. **Subject relevance**: Does the content discuss the prediction's subject matter?
2. **Outcome support**: Does it provide evidence for the claimed outcome (true/false)?
3. **Date verification**: Are there dates mentioned that confirm timing within the prediction's timeframe?
4. **Evidence quality**: Is the evidence direct (explicit statement) or indirect (circumstantial)?

Handle partial content gracefully. Paywalled sites may only return headlines, summaries, or partial text. If the available content mentions relevant facts that align with the claim, it can still corroborate.

## Output Format

Return ONLY valid JSON (no markdown fences):

```json
{
  "corroborates": true,
  "relevance_score": 0.85,
  "extracted_evidence": "Bitcoin surged past $100,000 on March 28, reaching $102,450...",
  "reasoning": "The article directly confirms Bitcoin exceeded $100k within the Q1 2025 timeframe."
}
```

**Fields:**

- `corroborates`: Boolean - does the source support the claim's outcome?
- `relevance_score`: 0.0 to 1.0 - how strongly does the evidence support the claim?
  - 0.9-1.0: Direct, explicit confirmation with dates
  - 0.7-0.9: Clear support but missing some details
  - 0.5-0.7: Indirect or circumstantial support
  - 0.3-0.5: Tangentially related
  - 0.0-0.3: Not relevant or contradicts
- `extracted_evidence`: The most relevant quote or summary from the source
- `reasoning`: Brief explanation of why the source does or doesn't support the claim

## Examples

### Example 1: Strong corroboration

**Input:**

```json
{
  "prediction": {
    "target": "Tesla will announce Cybertruck deliveries",
    "timeframe": "2023"
  },
  "claim": {
    "outcome": true,
    "reasoning": "Tesla began Cybertruck deliveries in November 2023."
  },
  "source": {
    "url": "https://reuters.com/...",
    "title": "Tesla delivers first Cybertrucks",
    "content": "Tesla Inc on Thursday began delivering its long-delayed Cybertruck pickup... The first deliveries took place at Tesla's Texas factory on November 30, 2023..."
  }
}
```

**Output:**

```json
{
  "corroborates": true,
  "relevance_score": 0.95,
  "extracted_evidence": "Tesla Inc on Thursday began delivering its long-delayed Cybertruck pickup... deliveries took place at Tesla's Texas factory on November 30, 2023",
  "reasoning": "Reuters directly confirms Cybertruck deliveries began in November 2023, within the predicted timeframe."
}
```

### Example 2: Paywalled but still corroborating

**Input:**

```json
{
  "prediction": {
    "target": "Fed will cut rates",
    "timeframe": "September 2024"
  },
  "claim": {
    "outcome": true,
    "reasoning": "The Federal Reserve cut rates by 50 basis points in September 2024."
  },
  "source": {
    "url": "https://wsj.com/...",
    "title": "Fed Cuts Rates by Half Point in Bold Move",
    "content": "The Federal Reserve cut interest rates by a half percentage point Wednesday... [content truncated]"
  }
}
```

**Output:**

```json
{
  "corroborates": true,
  "relevance_score": 0.8,
  "extracted_evidence": "The Federal Reserve cut interest rates by a half percentage point Wednesday",
  "reasoning": "The headline and partial content confirm a Fed rate cut. Though the full article is paywalled, the available text supports the claim."
}
```

### Example 3: Does not corroborate

**Input:**

```json
{
  "prediction": {
    "target": "Apple will release AR glasses",
    "timeframe": "2024"
  },
  "claim": {
    "outcome": true,
    "reasoning": "Apple launched Vision Pro AR headset in 2024."
  },
  "source": {
    "url": "https://techcrunch.com/...",
    "title": "Apple Vision Pro launches in US",
    "content": "Apple's Vision Pro mixed reality headset is now available for purchase in the United States..."
  }
}
```

**Output:**

```json
{
  "corroborates": false,
  "relevance_score": 0.4,
  "extracted_evidence": "Apple's Vision Pro mixed reality headset is now available",
  "reasoning": "Vision Pro is a VR/MR headset, not AR glasses. The prediction specifically mentioned AR glasses, which is a different product category. The source discusses a different product."
}
```

### Example 4: Contradicts the claim

**Input:**

```json
{
  "prediction": {
    "target": "Ethereum will reach $10,000",
    "timeframe": "by end of 2024"
  },
  "claim": {
    "outcome": true,
    "reasoning": "ETH hit $10,500 in December 2024."
  },
  "source": {
    "url": "https://coingecko.com/...",
    "title": "Ethereum Price History",
    "content": "Ethereum (ETH) reached an all-time high of $4,891 in November 2021... In December 2024, ETH traded between $3,200 and $4,100..."
  }
}
```

**Output:**

```json
{
  "corroborates": false,
  "relevance_score": 0.1,
  "extracted_evidence": "In December 2024, ETH traded between $3,200 and $4,100",
  "reasoning": "The source directly contradicts the claim. It shows ETH traded well below $10,000 in December 2024, not $10,500 as claimed."
}
```
