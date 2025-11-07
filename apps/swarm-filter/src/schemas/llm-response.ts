import type { PostSlice } from "@torus-ts/db/schema";
import { z } from "zod";

/**
 * Schema for prediction check response (Step 1: fast filter)
 */
export const PredictionCheckSchema = z.object({
  has_prediction: z.boolean(),
});

export type PredictionCheck = z.infer<typeof PredictionCheckSchema>;

/**
 * LLM PostSlice format (before transformation to DB format)
 * Can reference any tweet in the context (main tweet or context tweets)
 * Contains extracted text that will be programmatically converted to character indices
 */
export const LLMPostSliceSchema = z.object({
  tweet_id: z.string(),
  text: z.string().min(1),
});

export type LLMPostSlice = z.infer<typeof LLMPostSliceSchema>;

/**
 * Decimal string between 0 and 1
 */
const decimalSchema = z.string().refine((val) => {
  const num = parseFloat(val);
  return !isNaN(num) && num >= 0 && num <= 1;
}, "Must be a decimal between 0 and 1");

/**
 * Create prediction data schema with dynamic context schema.
 * The context schema changes based on the detected topic.
 */
export function createPredictionDataSchema<T extends z.ZodTypeAny>(
  contextSchema: T,
) {
  return z.object({
    goal: z.array(LLMPostSliceSchema).min(1),
    timeframe: z.array(LLMPostSliceSchema).min(1),
    topicName: z.string().min(1),
    predictionQuality: z.number().int().min(0).max(100),
    briefRationale: z.string().max(400),
    llmConfidence: decimalSchema,
    vagueness: decimalSchema.nullable().optional(),
    context: contextSchema,
  });
}

/**
 * Create LLM prediction response schema with dynamic context schema.
 * Returns a discriminated union based on has_prediction field.
 */
export function createLLMPredictionResponseSchema<T extends z.ZodTypeAny>(
  contextSchema: T,
) {
  const PredictionDataSchema = createPredictionDataSchema(contextSchema);

  const LLMNoPredictionSchema = z.object({
    has_prediction: z.literal(false),
    prediction_data: z.null(),
  });

  const LLMFoundPredictionSchema = z.object({
    has_prediction: z.literal(true),
    prediction_data: PredictionDataSchema,
  });

  return z.discriminatedUnion("has_prediction", [
    LLMNoPredictionSchema,
    LLMFoundPredictionSchema,
  ]);
}

/**
 * Tokenize text into words (non-whitespace sequences) with their positions.
 *
 * @param text - Text to tokenize
 * @returns Array of {word, start, end} objects with character positions
 */
function tokenizeWithPositions(
  text: string,
): { word: string; start: number; end: number }[] {
  const tokens: { word: string; start: number; end: number }[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return tokens;
}

/**
 * Find a sequence of words in a larger sequence.
 *
 * @param originalWords - Array of word strings from original text
 * @param searchWords - Array of word strings to find
 * @returns Starting index in originalWords, or -1 if not found
 */
function findWordSequence(
  originalWords: string[],
  searchWords: string[],
): number {
  if (searchWords.length === 0) return -1;

  for (let i = 0; i <= originalWords.length - searchWords.length; i++) {
    let match = true;
    for (let j = 0; j < searchWords.length; j++) {
      if (originalWords[i + j] !== searchWords[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }

  return -1;
}

/**
 * Find a text substring in a tweet and return its PostSlice with character indices.
 * Uses word-level matching to handle whitespace differences between LLM output and original text.
 *
 * Algorithm:
 * 1. Try exact character match first (fast path)
 * 2. Tokenize both texts into words, ignoring all whitespace
 * 3. Find the word sequence in the original
 * 4. Map back to character indices in original text
 *
 * @param tweetText - The tweet text to search in (decoded)
 * @param searchText - The substring to find (from LLM)
 * @param tweetId - The tweet ID for the PostSlice
 * @returns PostSlice with start/end indices in original text
 * @throws Error if text not found
 */
export function findTextSlice(
  tweetText: string,
  searchText: string,
  tweetId: string,
): PostSlice {
  // 1. Try exact match first (fast path)
  const exactIndex = tweetText.indexOf(searchText);

  if (exactIndex !== -1) {
    // Check for multiple occurrences
    const secondIndex = tweetText.indexOf(searchText, exactIndex + 1);
    if (secondIndex !== -1) {
      console.warn(
        `Multiple exact matches of "${searchText}" in tweet ${tweetId}. Using first occurrence at index ${exactIndex}.`,
      );
    }

    return {
      source: { tweet_id: tweetId },
      start: exactIndex,
      end: exactIndex + searchText.length,
    };
  }

  // 2. Word-level matching (whitespace-agnostic)
  const originalTokens = tokenizeWithPositions(tweetText);
  const searchTokens = tokenizeWithPositions(searchText);

  if (searchTokens.length === 0) {
    throw new Error(
      `Search text contains no words for tweet ${tweetId}: "${searchText}"`,
    );
  }

  // Extract just the words for sequence matching
  const originalWords = originalTokens.map((t) => t.word);
  const searchWords = searchTokens.map((t) => t.word);

  // Find where the search word sequence appears in original
  const matchIndex = findWordSequence(originalWords, searchWords);

  if (matchIndex !== -1) {
    // Map back to character indices
    const firstToken = originalTokens[matchIndex];
    const lastToken = originalTokens[matchIndex + searchWords.length - 1];

    if (!firstToken || !lastToken) {
      throw new Error(
        `Invalid token positions for tweet ${tweetId} at match index ${matchIndex}`,
      );
    }

    const start = firstToken.start;
    const end = lastToken.end;

    const matchedText = tweetText.substring(start, end);
    console.log(
      `Word-level match for tweet ${tweetId}:\n  Searched: "${searchText}"\n  Found: "${matchedText}"`,
    );

    return {
      source: { tweet_id: tweetId },
      start,
      end,
    };
  }

  // 3. No match found
  throw new Error(
    `Text not found in tweet ${tweetId} (tried exact and word-level matching).\nSearched: "${searchText}"\nSearched words: [${searchWords.join(", ")}]\nOriginal words: [${originalWords.join(", ")}]`,
  );
}

/**
 * Transform array of LLM PostSlices to database PostSlice format.
 * Searches for each extracted text in the corresponding tweet and calculates indices.
 *
 * @param llmSlices - LLM format: {tweet_id, text}[]
 * @param tweetTexts - Map of tweet_id to decoded tweet text
 * @returns DB format PostSlices with calculated indices
 * @throws Error if any text is not found in its tweet
 */
export function transformToPostSliceArray(
  llmSlices: LLMPostSlice[],
  tweetTexts: Record<string, string>,
): PostSlice[] {
  return llmSlices.map((llmSlice) => {
    const tweetText = tweetTexts[llmSlice.tweet_id];
    if (!tweetText) {
      throw new Error(
        `Tweet ${llmSlice.tweet_id} not found in context. Available tweets: ${Object.keys(tweetTexts).join(", ")}`,
      );
    }
    return findTextSlice(tweetText, llmSlice.text, llmSlice.tweet_id);
  });
}
