/* eslint-disable @typescript-eslint/no-unused-vars */

import BigNumber from "bignumber.js";
import { buildTaggedBigNumberClass } from "./bignumber";
// To manually test the async and sync error handling from the go-go-try, you must use any of the following:
// the tryAsync and trySync functions from the go-go-try package (https://github.com/torusresearch/go-go-try)
// the tryAsyncRawError and trySyncRawError functions from the go-go-try package (https://github.com/torusresearch/go-go-try)

// $ pnpm exec tsx src/main.ts

import { tryAsync, tryAsyncRawError } from "./error-handler/async-operations";
import { trySync, trySyncRawError } from "./error-handler/sync-operations";
import { runAsyncExamples } from "./error-handler/testsuit/async";
import { runSyncExamples } from "./error-handler/testsuit/sync";

// Example of creating a tagged BigNumber class
const MyBigNumber = buildTaggedBigNumberClass("MyBigNumber", BigNumber);

// Create a sample instance
const exampleNumber = MyBigNumber.make(100);

/**
 * This file is just an example of how to use the BigNumberBrand.
 * It's not actually used in the library.
 */

// Run the examples
async function runAllExamples() {
  // Run synchronous examples
  runSyncExamples();

  // Run asynchronous examples
  await runAsyncExamples();

  console.log("\n=== ALL EXAMPLES COMPLETED ===");
}

// Uncomment the line below to run all examples
await runAllExamples();
