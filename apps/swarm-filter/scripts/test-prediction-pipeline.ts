import { createDb } from "@torus-ts/db";
import * as schema from "@torus-ts/db/schema";
import { eq } from "drizzle-orm";
import { assert } from "tsafe";
import { writeFile } from "node:fs/promises";
import { OpenRouterClient } from "../src/ai/openrouter-client";
import { PromptLoader } from "../src/ai/prompt-loader";
import { PredictionExtractor } from "../src/services/prediction-extractor";

// ===== HARDCODED DATASETS =====
const TWEET_DATASET = [
  { tweetId: "1820491658515157010", humanLabel: true },
  { tweetId: "1603395710099111936", humanLabel: false },
  { tweetId: "1037665965402599426", humanLabel: false },
  { tweetId: "1037689108775153664", humanLabel: false },
  { tweetId: "1037154826658803714", humanLabel: false },
  { tweetId: "1814714763621900417", humanLabel: false },
  { tweetId: "1600471663555932161", humanLabel: true },
  { tweetId: "1827782372550480313", humanLabel: true },
  { tweetId: "963610285566132224", humanLabel: false },
  { tweetId: "1820992566663200942", humanLabel: false },
  { tweetId: "1827455806578520480", humanLabel: false },
  { tweetId: "1062074268194955271", humanLabel: false },
  { tweetId: "1074647527436107776", humanLabel: false },
  { tweetId: "1060840830108426240", humanLabel: false },
  { tweetId: "750839124857270273", humanLabel: false },
  { tweetId: "750835106265182208", humanLabel: false },
  { tweetId: "1514681241261551619", humanLabel: true },
  { tweetId: "921725031922716672", humanLabel: false },
  { tweetId: "1412488018544451589", humanLabel: false },
  { tweetId: "1026466549769560065", humanLabel: false },
  { tweetId: "921510355494408194", humanLabel: false },
  { tweetId: "921504944670367745", humanLabel: false },
  { tweetId: "921504291088715776", humanLabel: false },
  { tweetId: "921403001226510337", humanLabel: false },
  { tweetId: "921402875900715008", humanLabel: false },
  { tweetId: "1065430864216023040", humanLabel: false },
  { tweetId: "1065433902922137600", humanLabel: false },
  { tweetId: "1907497254665035798", humanLabel: true },
  { tweetId: "1057983354824544257", humanLabel: false },
  { tweetId: "1907486474033045545", humanLabel: true },
  { tweetId: "1057652901248688133", humanLabel: false },
  { tweetId: "1063807754748551169", humanLabel: false },
  { tweetId: "1056518952245968896", humanLabel: false },
  { tweetId: "1239089767062462464", humanLabel: false },
];

const PREDICTION_DATASET = [
  {
    predId: "019a5909-eae9-7518-a685-58570a3f4e6f",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a58fa-30a0-7bed-829a-2c1fea46ef58",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5909-b8af-792a-a58d-7e18ae9397df",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a590a-68f4-7a3a-b653-2f73f462b900",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a590c-c7b0-700a-b4e9-f547db7e27dd",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a590d-13f7-7cc4-b800-3f2e368813c2",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5906-9a62-7255-8183-dae57d2d6416",
    humanLabel: false,
    verifierLabel: true,
  },
  {
    predId: "019a58fe-b328-78d2-ad3e-80e7a5c1a920",
    humanLabel: false,
    verifierLabel: true,
  },
  {
    predId: "019a5911-dce2-7949-b1c7-05a087688bc7",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5916-0222-7943-b8a8-4a554f9854a9",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5911-1ea6-7943-b6ad-f512f0b63abf",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5915-0e4a-7176-a394-7fd6a22b8933",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5915-f24e-7cfb-a9d7-fdba44995d70",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5911-ca42-7015-8c7e-234fa31e952a",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5911-dce2-79b9-bf10-980617624ff2",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5913-ddab-7bbd-8376-b59dc41c7b9d",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5915-95bf-717b-9453-f3926bb58c18",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5916-6fb3-7c0a-b246-0a28ce5b37e3",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5912-765d-740f-a9cf-5945393ada24",
    humanLabel: false,
    verifierLabel: true,
  },
  {
    predId: "019a5915-3f71-75c1-9d2f-4eedaab34a97",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5917-9673-70c6-8823-9d2b05700663",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a592d-1895-7df3-879c-df49e25a6456",
    humanLabel: false,
    verifierLabel: true,
  },
  {
    predId: "019a591a-b288-75a4-a99c-2ac4746f72a5",
    humanLabel: true,
    verifierLabel: true,
  },
  {
    predId: "019a5920-bbdc-7685-9ad0-37086d80c9d0",
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
  await writeFile(
    datasetFilename,
    JSON.stringify(testCases, null, 2),
    "utf-8"
  );
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
