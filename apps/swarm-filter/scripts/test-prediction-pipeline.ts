import { writeFile } from "node:fs/promises";
import { createDb } from "@torus-ts/db";
import * as schema from "@torus-ts/db/schema";
import { eq } from "drizzle-orm";
import { assert } from "tsafe";
import { OpenRouterClient } from "../src/ai/openrouter-client";
import { PromptLoader } from "../src/ai/prompt-loader";
import { PredictionExtractor } from "../src/services/prediction-extractor";

// ===== HARDCODED DATASETS =====
const TWEET_DATASET = [
  { tweetId: "1908539359587942893", humanLabel: false },
  { tweetId: "1985721801331159441", humanLabel: false },
  { tweetId: "1985632717178900535", humanLabel: false },
  { tweetId: "1037689108775153664", humanLabel: false },
  { tweetId: "1840818898070913513", humanLabel: false },
  { tweetId: "1839945183120458025", humanLabel: false },
  { tweetId: "1839968539756613889", humanLabel: false },
  { tweetId: "1839814403124044278", humanLabel: false },
  { tweetId: "1839727879153738187", humanLabel: false },
  { tweetId: "1839713358771302788", humanLabel: false },
  { tweetId: "1839898066121617614", humanLabel: false },
  { tweetId: "1838931757045030960", humanLabel: false },
  { tweetId: "1839896044362231942", humanLabel: false },
  { tweetId: "1841567233417576497", humanLabel: false },
  { tweetId: "1840958243386114172", humanLabel: false },
  { tweetId: "1840992908196851982", humanLabel: false },
  { tweetId: "1840931648797282371", humanLabel: false },
  { tweetId: "1840851091975446547", humanLabel: false },
  { tweetId: "1840318262870974576", humanLabel: false },
  { tweetId: "1834574461921620164", humanLabel: false },
  { tweetId: "1840444367527461121", humanLabel: false },
  { tweetId: "1839389574570848687", humanLabel: false },
  { tweetId: "1840060762389410190", humanLabel: false },
  { tweetId: "1839783215365525977", humanLabel: false },
  { tweetId: "1839658097314275441", humanLabel: false },
  { tweetId: "1839785424618697197", humanLabel: false },
  { tweetId: "1839060454401827154", humanLabel: false },
  { tweetId: "1840505662062899547", humanLabel: false },
  { tweetId: "1839125391694319984", humanLabel: false },
  { tweetId: "1840436520949526570", humanLabel: false },
  { tweetId: "1838654649240256707", humanLabel: false },
  { tweetId: "1906131495330173264", humanLabel: false },
  { tweetId: "1904432450580673016", humanLabel: false },
  { tweetId: "1904502657890349546", humanLabel: false },
];

const PREDICTION_DATASET = [
  {
    predId: "019a7082-3756-7afc-9041-0eff097b83a8",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a7083-b515-73d0-a5a6-4186a8c36bfe",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a7086-72a9-7cee-a44a-e7c3377e8cc0",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a590a-68f4-7a3a-b653-2f73f462b900",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a7084-a0a2-7592-a62d-2ff32fe7d1b0",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a709d-0937-7548-9623-c465696227e7",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a709d-bed9-7814-abcc-71dde713d793",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a708b-987a-7ac0-ae08-fda38df72eb7",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a708e-c70e-7738-a165-bb88172710f9",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a7090-fbbf-77c0-9f9b-6a16922cb274",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a7091-66b4-79ea-ad53-f6486497965c",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a709f-7753-74ed-9417-4b111fe195a7",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a7085-a515-7a4c-aae2-8b6aff1ef660",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a70a5-28cc-7b8f-b65c-ff27f8035e8e",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a7059-5acb-7a8c-b98c-eeb5c7685c7c",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a7041-c306-785f-9aed-49e9d772f89a",
    humanLabel: false,
    verifierLabel: false,
  },
  {
    predId: "019a704b-8aca-75b3-b38b-c789d27aa5e1",
    humanLabel: false,
    verifierLabel: false,
  },
  {
    predId: "019a5916-6fb3-7c0a-b246-0a28ce5b37e3",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a703c-849c-709e-9b77-4c898d852465",
    humanLabel: false,
    verifierLabel: false,
  },
  {
    predId: "019a5915-3f71-75c1-9d2f-4eedaab34a97",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a7040-fbd9-747f-bdf8-a82ce6c5dc30",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a592d-1895-7df3-879c-df49e25a6456",
    humanLabel: false,
    verifierLabel: true,
  },
  {
    predId: "019a706e-a4c9-7ed7-af4c-b90ec09f88f5",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a7053-000f-71bb-898a-ae7f4dffc890",
    humanLabel: true,
    verifierLabel: true,
  },
];

const CONFIG = {
  models: {
    predictionCheck:
      process.env.PREDICTION_CHECK_MODEL || "meta-llama/llama-3.2-1b-instruct",
    topicClassification:
      process.env.TOPIC_CLASSIFICATION_MODEL || "google/gemini-2.5-flash",
    extraction:
      process.env.PREDICTION_EXTRACTION_MODEL || "anthropic/claude-sonnet-4.5",
  },
};
// ==============================

interface TestCase {
  tweetId: string;
  mainTweet: string;
  contextTweets: Record<string, string>;
  expectedLabel: boolean;
}

interface ConfusionMatrix {
  TP: number;
  FP: number;
  TN: number;
  FN: number;
}

interface TestResults {
  step1: ConfusionMatrix;
  step3: ConfusionMatrix;
  failures: {
    tweetId: string;
    step: number;
    expected: boolean;
    got: boolean;
    tweetText: string;
  }[];
}

async function fetchTweetData(
  db: ReturnType<typeof createDb>,
  tweetId: string,
): Promise<{ mainTweet: string; contextTweets: Record<string, string> }> {
  const scrapedTweet = await db.query.scrapedTweetSchema.findFirst({
    where: eq(schema.scrapedTweetSchema.id, BigInt(tweetId)),
  });

  if (!scrapedTweet) {
    throw new Error(`Tweet ${tweetId} not found`);
  }

  const contextTweets: Record<string, string> = {};
  if (scrapedTweet.conversationId) {
    const conversationTweets = await db.query.scrapedTweetSchema.findMany({
      where: eq(
        schema.scrapedTweetSchema.conversationId,
        scrapedTweet.conversationId,
      ),
    });

    for (const ctxTweet of conversationTweets) {
      if (ctxTweet.id !== scrapedTweet.id) {
        contextTweets[ctxTweet.id.toString()] = ctxTweet.text;
      }
    }
  }

  return {
    mainTweet: scrapedTweet.text,
    contextTweets,
  };
}

async function getTweetIdFromPrediction(
  db: ReturnType<typeof createDb>,
  predictionId: string,
): Promise<string> {
  const scrapedTweet = await db.query.scrapedTweetSchema.findFirst({
    where: eq(schema.scrapedTweetSchema.predictionId, predictionId),
  });

  if (!scrapedTweet) {
    throw new Error(`Tweet not found for prediction ${predictionId}`);
  }

  return scrapedTweet.id.toString();
}

function updateConfusionMatrix(
  matrix: ConfusionMatrix,
  expected: boolean,
  predicted: boolean,
): void {
  if (expected && predicted) matrix.TP++;
  else if (!expected && predicted) matrix.FP++;
  else if (!expected && !predicted) matrix.TN++;
  else if (expected && !predicted) matrix.FN++;
}

function calculateMetrics(matrix: ConfusionMatrix) {
  const total = matrix.TP + matrix.FP + matrix.TN + matrix.FN;
  const accuracy = total > 0 ? (matrix.TP + matrix.TN) / total : 0;
  const precision =
    matrix.TP + matrix.FP > 0 ? matrix.TP / (matrix.TP + matrix.FP) : 0;
  const recall =
    matrix.TP + matrix.FN > 0 ? matrix.TP / (matrix.TP + matrix.FN) : 0;
  const f1 =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

  return { accuracy, precision, recall, f1 };
}

async function main() {
  console.log("=== Prediction Pipeline Test ===\n");
  console.log(`Models:`);
  console.log(`  Step 1 (Check): ${CONFIG.models.predictionCheck}`);
  console.log(`  Step 2 (Topic): ${CONFIG.models.topicClassification}`);
  console.log(`  Step 3 (Extract): ${CONFIG.models.extraction}`);
  console.log();

  // Initialize DB
  const db = createDb();

  // Build test cases from both datasets
  console.log("Fetching tweet data from database...");
  const testCases: TestCase[] = [];

  // Process tweet dataset
  for (const item of TWEET_DATASET) {
    try {
      const { mainTweet, contextTweets } = await fetchTweetData(
        db,
        item.tweetId,
      );
      testCases.push({
        tweetId: item.tweetId,
        mainTweet,
        contextTweets,
        expectedLabel: item.humanLabel,
      });
    } catch (error) {
      console.error(`Failed to fetch tweet ${item.tweetId}:`, error);
    }
  }

  // Process prediction dataset
  for (const item of PREDICTION_DATASET) {
    try {
      const tweetId = await getTweetIdFromPrediction(db, item.predId);
      const { mainTweet, contextTweets } = await fetchTweetData(db, tweetId);
      testCases.push({
        tweetId,
        mainTweet,
        contextTweets,
        expectedLabel: item.humanLabel,
      });
    } catch (error) {
      console.error(`Failed to fetch prediction ${item.predId}:`, error);
    }
  }

  console.log(`Successfully loaded ${testCases.length} test cases\n`);

  // Save the fetched dataset to a JSON file
  const timestamp = Date.now();
  const datasetFilename = `apps/swarm-filter/derenash-${timestamp}.json`;
  console.log(`Saving fetched dataset to ${datasetFilename}...`);
  await writeFile(datasetFilename, JSON.stringify(testCases, null, 2), "utf-8");
  console.log(`Dataset saved successfully!\n`);

  // Initialize models (all OpenRouter)
  console.log("Initializing models...");

  const apiKey = process.env.OPENROUTER_API_KEY;
  assert(
    apiKey !== undefined,
    "OPENROUTER_API_KEY must be set in environment variables",
  );

  const predictionCheckClient = new OpenRouterClient({
    apiKey,
    model: CONFIG.models.predictionCheck,
  });

  const topicClassificationClient = new OpenRouterClient({
    apiKey,
    model: CONFIG.models.topicClassification,
  });

  const extractionClient = new OpenRouterClient({
    apiKey,
    model: CONFIG.models.extraction,
  });

  const promptLoader = new PromptLoader("apps/swarm-filter/prompts");

  const extractor = new PredictionExtractor({
    predictionCheckClient,
    topicClassificationClient,
    extractionClient,
    promptLoader,
    devMode: false,
  });

  // Initialize results tracking
  const results: TestResults = {
    step1: { TP: 0, FP: 0, TN: 0, FN: 0 },
    step3: { TP: 0, FP: 0, TN: 0, FN: 0 },
    failures: [],
  };

  // Run tests
  console.log("Running tests...\n");
  let processed = 0;

  for (const testCase of testCases) {
    processed++;
    console.log(
      `[${processed}/${testCases.length}] Testing tweet ${testCase.tweetId}...`,
    );

    try {
      // Convert to format expected by extractor
      const mainTweetData = {
        id: testCase.tweetId,
        text: testCase.mainTweet,
        authorId: "unknown",
        date: new Date(),
        quotedId: null,
        conversationId: null,
        parentTweetId: null,
      };

      const contextTweetData: Record<string, typeof mainTweetData> = {};
      for (const [id, text] of Object.entries(testCase.contextTweets)) {
        contextTweetData[id] = {
          id,
          text,
          authorId: "unknown",
          date: new Date(),
          quotedId: null,
          conversationId: null,
          parentTweetId: null,
        };
      }

      // Track stats before running
      const filteredBefore = extractor.stats.tweetsFiltered;

      // Run through full extraction pipeline
      const extractionResult = await extractor.extractPrediction(
        mainTweetData,
        contextTweetData,
      );

      // Determine what happened at each step
      const passedStep1 = extractor.stats.tweetsFiltered === filteredBefore; // No increase = passed
      const step3Result = extractionResult !== null;

      // Track Step 1 metrics (all tweets go through this)
      updateConfusionMatrix(results.step1, testCase.expectedLabel, passedStep1);

      if (!passedStep1 && testCase.expectedLabel) {
        results.failures.push({
          tweetId: testCase.tweetId,
          step: 1,
          expected: testCase.expectedLabel,
          got: false,
          tweetText: testCase.mainTweet,
        });
      }

      // Track Step 3 metrics (only for tweets that passed step 1)
      if (passedStep1) {
        updateConfusionMatrix(
          results.step3,
          testCase.expectedLabel,
          step3Result,
        );

        if (step3Result !== testCase.expectedLabel) {
          results.failures.push({
            tweetId: testCase.tweetId,
            step: 3,
            expected: testCase.expectedLabel,
            got: step3Result,
            tweetText: testCase.mainTweet,
          });
        }
      }
    } catch (error) {
      console.error(`Error processing tweet ${testCase.tweetId}:`, error);
    }
  }

  // Display results
  console.log("\n" + "=".repeat(60));
  console.log("RESULTS");
  console.log("=".repeat(60));

  console.log("\nStep 1: Prediction Check");
  console.log("------------------------");
  console.log(`TP: ${results.step1.TP} | FP: ${results.step1.FP}`);
  console.log(`FN: ${results.step1.FN} | TN: ${results.step1.TN}`);
  const step1Metrics = calculateMetrics(results.step1);
  console.log(`Accuracy: ${(step1Metrics.accuracy * 100).toFixed(2)}%`);
  console.log(`Precision: ${(step1Metrics.precision * 100).toFixed(2)}%`);
  console.log(`Recall: ${(step1Metrics.recall * 100).toFixed(2)}%`);
  console.log(`F1: ${(step1Metrics.f1 * 100).toFixed(2)}%`);

  console.log("\nStep 3: Extraction (for tweets that passed Step 1)");
  console.log("--------------------------------------------------");
  console.log(`TP: ${results.step3.TP} | FP: ${results.step3.FP}`);
  console.log(`FN: ${results.step3.FN} | TN: ${results.step3.TN}`);
  const step3Metrics = calculateMetrics(results.step3);
  console.log(`Accuracy: ${(step3Metrics.accuracy * 100).toFixed(2)}%`);
  console.log(`Precision: ${(step3Metrics.precision * 100).toFixed(2)}%`);
  console.log(`Recall: ${(step3Metrics.recall * 100).toFixed(2)}%`);
  console.log(`F1: ${(step3Metrics.f1 * 100).toFixed(2)}%`);

  // Show failures
  if (results.failures.length > 0) {
    console.log(`\n\nFailures (${results.failures.length}):`);
    console.log("=".repeat(60));
    for (const failure of results.failures) {
      console.log(`\nTweet ID: ${failure.tweetId}`);
      console.log(`Step: ${failure.step}`);
      console.log(`Expected: ${failure.expected} | Got: ${failure.got}`);
      console.log(`Text: ${failure.tweetText}`);
    }
  }

  console.log("\n\nTest complete. Exiting...");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
