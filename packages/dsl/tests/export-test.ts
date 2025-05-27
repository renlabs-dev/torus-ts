// This file tests that the JSON parsing functions are correctly exported from index.ts

import { parseConstraintJson, safeParseConstraintJson, JsonParseError } from '../src/index';

// Just a simple check to make sure the functions are properly exported
console.log("\n=== EXPORT TEST ===");
console.log(`parseConstraintJson exported: ${typeof parseConstraintJson === 'function' ? '✅' : '❌'}`);
console.log(`safeParseConstraintJson exported: ${typeof safeParseConstraintJson === 'function' ? '✅' : '❌'}`);
console.log(`JsonParseError exported: ${typeof JsonParseError === 'function' ? '✅' : '❌'}`);
console.log("=== EXPORT TEST COMPLETED ===\n");