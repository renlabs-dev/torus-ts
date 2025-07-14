/**
 * Module containing wrappers to helping handling the Torus Substrate chain's
 * storages, constants, extrinsics etc.
 */

// Core storage wrapper classes
export { SbStorageValue, SbStorageMap, SbStorageDoubleMap } from "./storage.js";

// Storage router for convenient access to all pallets
export { createStorageRouter } from "./test-wrapers/index.js";
export type { StorageRouter } from "./test-wrapers/index.js";

// Test suite for storage wrappers
export { storageUnitTests } from "./test-wrapers/tests-suit.js";
