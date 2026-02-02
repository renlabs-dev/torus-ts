import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { DB } from "@torus-ts/db/client";
import { scrapedSourcesSchema } from "@torus-ts/db/schema";
import { eq } from "drizzle-orm";

export {
  getDomainTier,
  calculateDomainScore,
  type DomainTier,
} from "./domain-tiers.js";

interface FirecrawlMetadata {
  title?: string;
  description?: string;
  language?: string;
  statusCode?: number;
}

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    metadata?: FirecrawlMetadata;
  };
}

export interface ScrapeResult {
  url: string;
  normalizedUrl: string;
  content: string | null;
  title: string | null;
  description: string | null;
  fetchedAt: Date;
}

export interface ScrapeError {
  url: string;
  normalizedUrl: string;
  error: string;
  statusCode?: number;
  fetchedAt: Date;
}

export type ScrapeOutcome =
  | { ok: true; result: ScrapeResult }
  | { ok: false; error: ScrapeError };

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TEMPORARY_ERROR_TTL_MS = 60 * 60 * 1000;
const PERMANENT_ERROR_CODES = [404, 410, 451];
const TEMPORARY_ERROR_CODES = [408, 429, 500, 502, 503, 504];

export function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";
  url.searchParams.sort();
  return url.toString();
}

function isCacheValid(
  cached: typeof scrapedSourcesSchema.$inferSelect,
): boolean {
  const age = Date.now() - cached.createdAt.getTime();

  if (cached.success) {
    return age < DEFAULT_TTL_MS;
  }

  if (cached.statusCode && PERMANENT_ERROR_CODES.includes(cached.statusCode)) {
    return true;
  }

  if (cached.statusCode && TEMPORARY_ERROR_CODES.includes(cached.statusCode)) {
    return age < TEMPORARY_ERROR_TTL_MS;
  }

  return age < DEFAULT_TTL_MS;
}

export async function scrapePage(
  db: DB,
  rawUrl: string,
  firecrawlApiKey: string,
): Promise<ScrapeOutcome> {
  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeUrl(rawUrl);
  } catch {
    return {
      ok: false,
      error: {
        url: rawUrl,
        normalizedUrl: rawUrl,
        error: "Invalid URL",
        fetchedAt: new Date(),
      },
    };
  }

  const [cached] = await db
    .select()
    .from(scrapedSourcesSchema)
    .where(eq(scrapedSourcesSchema.normalizedUrl, normalizedUrl))
    .limit(1);

  if (cached && isCacheValid(cached)) {
    if (cached.success) {
      return {
        ok: true,
        result: {
          url: cached.originalUrl,
          normalizedUrl: cached.normalizedUrl,
          content: cached.content,
          title: cached.title,
          description: cached.description,
          fetchedAt: cached.createdAt,
        },
      };
    } else {
      return {
        ok: false,
        error: {
          url: cached.originalUrl,
          normalizedUrl: cached.normalizedUrl,
          error: cached.error ?? "Unknown error",
          statusCode: cached.statusCode ?? undefined,
          fetchedAt: cached.createdAt,
        },
      };
    }
  }

  const [fetchError, response] = await tryAsync(
    fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: rawUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
      }),
    }),
  );

  if (fetchError !== undefined) {
    const outcome: ScrapeOutcome = {
      ok: false,
      error: {
        url: rawUrl,
        normalizedUrl,
        error: `Fetch failed: ${fetchError.message}`,
        fetchedAt: new Date(),
      },
    };
    await cacheOutcome(db, outcome);
    return outcome;
  }

  if (!response.ok) {
    const [, errorText] = await tryAsync(response.text());
    const outcome: ScrapeOutcome = {
      ok: false,
      error: {
        url: rawUrl,
        normalizedUrl,
        error: `Firecrawl API error: ${response.status} ${response.statusText} - ${errorText ?? ""}`,
        statusCode: response.status,
        fetchedAt: new Date(),
      },
    };
    await cacheOutcome(db, outcome);
    return outcome;
  }

  const [jsonError, json] = await tryAsync(
    response.json() as Promise<FirecrawlResponse>,
  );

  if (jsonError !== undefined || !json.success) {
    const outcome: ScrapeOutcome = {
      ok: false,
      error: {
        url: rawUrl,
        normalizedUrl,
        error: jsonError?.message ?? "Firecrawl scrape failed",
        fetchedAt: new Date(),
      },
    };
    await cacheOutcome(db, outcome);
    return outcome;
  }

  const targetStatusCode = json.data?.metadata?.statusCode;
  if (targetStatusCode && targetStatusCode >= 400) {
    const outcome: ScrapeOutcome = {
      ok: false,
      error: {
        url: rawUrl,
        normalizedUrl,
        error: `Target URL returned ${targetStatusCode}`,
        statusCode: targetStatusCode,
        fetchedAt: new Date(),
      },
    };
    await cacheOutcome(db, outcome);
    return outcome;
  }

  const content =
    json.data?.markdown ?? json.data?.html ?? json.data?.rawHtml ?? null;

  const outcome: ScrapeOutcome = {
    ok: true,
    result: {
      url: rawUrl,
      normalizedUrl,
      content,
      title: json.data?.metadata?.title ?? null,
      description: json.data?.metadata?.description ?? null,
      fetchedAt: new Date(),
    },
  };

  await cacheOutcome(db, outcome);
  return outcome;
}

async function cacheOutcome(db: DB, outcome: ScrapeOutcome): Promise<void> {
  if (outcome.ok) {
    await db
      .insert(scrapedSourcesSchema)
      .values({
        normalizedUrl: outcome.result.normalizedUrl,
        originalUrl: outcome.result.url,
        success: true,
        content: outcome.result.content,
        title: outcome.result.title,
        description: outcome.result.description,
      })
      .onConflictDoUpdate({
        target: scrapedSourcesSchema.normalizedUrl,
        set: {
          originalUrl: outcome.result.url,
          success: true,
          content: outcome.result.content,
          title: outcome.result.title,
          description: outcome.result.description,
          statusCode: null,
          error: null,
          updatedAt: new Date(),
        },
      });
  } else {
    await db
      .insert(scrapedSourcesSchema)
      .values({
        normalizedUrl: outcome.error.normalizedUrl,
        originalUrl: outcome.error.url,
        success: false,
        error: outcome.error.error,
        statusCode: outcome.error.statusCode,
      })
      .onConflictDoUpdate({
        target: scrapedSourcesSchema.normalizedUrl,
        set: {
          originalUrl: outcome.error.url,
          success: false,
          error: outcome.error.error,
          statusCode: outcome.error.statusCode,
          content: null,
          title: null,
          description: null,
          updatedAt: new Date(),
        },
      });
  }
}
