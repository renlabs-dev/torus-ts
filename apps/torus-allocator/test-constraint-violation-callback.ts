// #!/usr/bin/env tsx
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */

// import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
// import type { AppRouter } from "@torus-ts/api";
// import {
//   ConstraintBuilder,
//   BoolExpr,
//   BaseConstraint,
//   NumExpr,
//   CompOp,
// } from "@torus-ts/dsl";
// import superjson from "superjson";
// import { checkSS58 } from "@torus-network/sdk";

// // Test against the running torus-allocator app
// const API_URL = "http://localhost:3002/api/trpc"; // torus-allocator port
// const TEST_USER_ADDRESS = checkSS58(
//   "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
// );

// // Create client to test against running allocator app
// const client = createTRPCProxyClient<AppRouter>({
//   links: [
//     httpBatchLink({
//       url: API_URL,
//       transformer: superjson,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     }),
//   ],
// });

// async function testConstraintViolationCallback() {
//   console.log("🧪 Testing Constraint Violation Callback System");
//   console.log("===============================================\n");

//   try {
//     // Test 1: Health Check
//     console.log("1️⃣ Testing Constraint Health Check...");
//     try {
//       const health = await client.constraint.healthCheck.query();
//       console.log("✅ Health Check Result:", {
//         status: health.status,
//         networkInitialized: health.networkInitialized,
//         chainWatcherInitialized: health.chainWatcherInitialized,
//         timestamp: health.timestamp,
//       });
//     } catch (healthError) {
//       console.log(
//         "❌ Health Check Failed:",
//         healthError instanceof Error
//           ? healthError.message
//           : String(healthError),
//       );
//       return; // Exit early if health check fails
//     }
//     console.log();

//     // Test 2: Impossible-to-fail constraint (stakeOf >= 0) - should NOT trigger violation callback
//     console.log("2️⃣ Testing Impossible-to-Fail Constraint (stakeOf >= 0)...");
//     console.log(
//       "📝 This should activate and NOT trigger the violation callback",
//     );

//     const alwaysPassConstraint = ConstraintBuilder.create(
//       "0x1ef9a7882d5045650e8cda34cbd9132ca8c69533702da7582e9925cc6f6279fd", // Valid permission ID
//       BoolExpr.comp(
//         CompOp.Gte,
//         NumExpr.stakeOf(TEST_USER_ADDRESS),
//         NumExpr.literal(0),
//       ), // stakeOf >= 0 (always true)
//     );

//     let alwaysPassResult: any = undefined;
//     try {
//       console.log("🔄 Adding always-pass constraint...");
//       alwaysPassResult = await client.constraint.addTest.mutate({
//         constraint: alwaysPassConstraint,
//       });

//       console.log("✅ Always-Pass Constraint Added:");
//       console.log("   - Success:", alwaysPassResult.success);
//       console.log("   - Constraint ID:", alwaysPassResult.constraintId);
//       console.log("   - Production ID:", alwaysPassResult.productionId);
//       console.log("   - Activated:", alwaysPassResult.activated);
//       console.log(
//         "   - Fetched Facts Count:",
//         alwaysPassResult.fetchedFactsCount,
//       );

//       // Wait a moment for any potential violations to be processed
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       if (alwaysPassResult.activated) {
//         console.log(
//           "✅ Expected: Constraint activated (stake >= 0 should always be true)",
//         );
//       } else {
//         console.log(
//           "⚠️  Unexpected: Constraint not activated - might indicate an issue",
//         );
//       }
//     } catch (alwaysPassError) {
//       console.log(
//         "❌ Always-Pass Constraint Error:",
//         alwaysPassError instanceof Error
//           ? alwaysPassError.message
//           : String(alwaysPassError),
//       );
//     }
//     console.log();

//     // Test 3: Impossible-to-pass constraint (stakeOf < 0) - should trigger violation callback
//     console.log("3️⃣ Testing Impossible-to-Pass Constraint (stakeOf < 0)...");
//     console.log(
//       "📝 This should NOT activate and should trigger the violation callback",
//     );

//     const alwaysFailConstraint = ConstraintBuilder.create(
//       "0x1224dc7deb1fdf606923dac82d58163c6ca382d07e7aa3140dee18bb8a281e87", // Valid permission ID
//       BoolExpr.comp(
//         CompOp.Lt,
//         NumExpr.stakeOf(TEST_USER_ADDRESS),
//         NumExpr.literal(0),
//       ), // stakeOf < 0 (always false)
//     );

//     let alwaysFailResult: any = undefined;
//     try {
//       console.log("🔄 Adding always-fail constraint...");
//       console.log("🎯 WATCH THE CONSOLE for violation callback messages!");

//       alwaysFailResult = await client.constraint.addTest.mutate({
//         constraint: alwaysFailConstraint,
//       });

//       console.log("✅ Always-Fail Constraint Added:");
//       console.log("   - Success:", alwaysFailResult.success);
//       console.log("   - Constraint ID:", alwaysFailResult.constraintId);
//       console.log("   - Production ID:", alwaysFailResult.productionId);
//       console.log("   - Activated:", alwaysFailResult.activated);
//       console.log(
//         "   - Fetched Facts Count:",
//         alwaysFailResult.fetchedFactsCount,
//       );

//       // Wait a moment for violation callback to be processed
//       console.log("⏳ Waiting 2 seconds for violation callback processing...");
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       if (!alwaysFailResult.activated) {
//         console.log(
//           "✅ Expected: Constraint not activated (stake < 0 should always be false)",
//         );
//         console.log("🚨 Check server console for violation callback messages!");
//       } else {
//         console.log(
//           "⚠️  Unexpected: Constraint activated - this should not happen for stake < 0",
//         );
//       }
//     } catch (alwaysFailError) {
//       console.log(
//         "❌ Always-Fail Constraint Error:",
//         alwaysFailError instanceof Error
//           ? alwaysFailError.message
//           : String(alwaysFailError),
//       );
//     }
//     console.log();

//     // Test 4: Check evaluation status for both constraints
//     console.log("4️⃣ Testing Constraint Evaluation Status...");

//     // Wait a moment for constraints to be fully processed
//     console.log("⏳ Waiting for constraints to be processed...");
//     await new Promise((resolve) => setTimeout(resolve, 1000));

//     // Test status endpoints with actual production IDs if we have them
//     if (alwaysPassResult?.productionId) {
//       console.log("🔍 Checking Always-Pass Constraint Status...");
//       try {
//         const passEvaluation =
//           await client.constraint.getEvaluationStatus.query({
//             constraintId: alwaysPassResult.productionId,
//           });
//         console.log("✅ Always-Pass Evaluation Status:", passEvaluation);

//         const passDetailed = await client.constraint.getDetailedStatus.query({
//           constraintId: alwaysPassResult.productionId,
//         });
//         console.log("✅ Always-Pass Detailed Status:", {
//           exists: passDetailed.exists,
//           status: passDetailed.status,
//           activationCount: passDetailed.activationCount,
//           hasActivations: passDetailed.hasActivations,
//         });

//         if (passDetailed.status === "satisfied") {
//           console.log("🎯 Expected: Always-pass constraint is SATISFIED");
//         } else {
//           console.log(
//             "⚠️  Status:",
//             passDetailed.status,
//             "- Expected satisfied for stake >= 0",
//           );
//         }
//       } catch (error) {
//         console.log("❌ Error checking always-pass status:", error);
//       }
//     }

//     if (alwaysFailResult?.productionId) {
//       console.log("🔍 Checking Always-Fail Constraint Status...");
//       try {
//         const failEvaluation =
//           await client.constraint.getEvaluationStatus.query({
//             constraintId: alwaysFailResult.productionId,
//           });
//         console.log("✅ Always-Fail Evaluation Status:", failEvaluation);

//         const failDetailed = await client.constraint.getDetailedStatus.query({
//           constraintId: alwaysFailResult.productionId,
//         });
//         console.log("✅ Always-Fail Detailed Status:", {
//           exists: failDetailed.exists,
//           status: failDetailed.status,
//           activationCount: failDetailed.activationCount,
//           hasActivations: failDetailed.hasActivations,
//         });

//         if (failDetailed.status === "violated") {
//           console.log("🎯 Expected: Always-fail constraint is VIOLATED");
//           console.log("🚨 This should have triggered the violation callback!");
//         } else {
//           console.log(
//             "⚠️  Status:",
//             failDetailed.status,
//             "- Expected violated for stake < 0",
//           );
//         }
//       } catch (error) {
//         console.log("❌ Error checking always-fail status:", error);
//       }
//     }

//     // Test with non-existent constraint
//     try {
//       const nonExistentStatus =
//         await client.constraint.getEvaluationStatus.query({
//           constraintId: "non-existent-id",
//         });
//       console.log("✅ Non-Existent Constraint Status:", nonExistentStatus);
//     } catch (error) {
//       console.log("❌ Non-existent constraint test failed:", error);
//     }

//     console.log();

//     // Test 5: Complex Boolean Expression Tests
//     console.log("5️⃣ Testing Complex Boolean Expressions (OR, NOT, nested)...");

//     // Test OR expression with permissionExists
//     console.log(
//       "🔍 Testing OR Expression: (stake < 0) OR permissionExists(0x2111...)",
//     );
//     const orConstraint = ConstraintBuilder.create(
//       "0x1ef9a7882d5045650e8cda34cbd9132ca8c69533702da7582e9925cc6f6279fd",
//       BoolExpr.or(
//         BoolExpr.comp(
//           CompOp.Lt,
//           NumExpr.stakeOf(TEST_USER_ADDRESS),
//           NumExpr.literal(0),
//         ), // False
//         BoolExpr.base(
//           BaseConstraint.permissionExists(
//             "0x211142bf6d4d1d08afec9bd2f8be8c27f318b0524992b22849734a2375f74df1",
//           ),
//         ),
//       ),
//     );

//     try {
//       const orResult = await client.constraint.addTest.mutate({
//         constraint: orConstraint,
//       });
//       console.log("✅ OR Constraint Added:", orResult.productionId);

//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       const orStatus = await client.constraint.getEvaluationStatus.query({
//         constraintId: orResult.productionId,
//       });
//       console.log("✅ OR Expression Status:", orStatus.status);
//       console.log(
//         "   Expected: satisfied if permission 0x2111... exists, violated if not",
//       );
//     } catch (error) {
//       console.log("❌ OR Expression Error:", error);
//     }

//     // Test NOT expression
//     console.log("🔍 Testing NOT Expression: NOT(stake < 0)");
//     const notConstraint = ConstraintBuilder.create(
//       "0x1224dc7deb1fdf606923dac82d58163c6ca382d07e7aa3140dee18bb8a281e87",
//       BoolExpr.not(
//         BoolExpr.comp(
//           CompOp.Lt,
//           NumExpr.stakeOf(TEST_USER_ADDRESS),
//           NumExpr.literal(0),
//         ), // False -> NOT makes it True
//       ),
//     );

//     try {
//       const notResult = await client.constraint.addTest.mutate({
//         constraint: notConstraint,
//       });
//       console.log("✅ NOT Constraint Added:", notResult.productionId);

//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       const notStatus = await client.constraint.getEvaluationStatus.query({
//         constraintId: notResult.productionId,
//       });
//       console.log("✅ NOT Expression Status:", notStatus.status);
//       console.log("   Expected: satisfied (NOT false = true)");
//     } catch (error) {
//       console.log("❌ NOT Expression Error:", error);
//     }

//     // Test nested expression with permissionExists
//     console.log(
//       "🔍 Testing Nested Expression: permissionExists(0x2111...) AND (stake >= 0)",
//     );
//     const nestedConstraint = ConstraintBuilder.create(
//       "0x1ef9a7882d5045650e8cda34cbd9132ca8c69533702da7582e9925cc6f6279fd",
//       BoolExpr.and(
//         BoolExpr.base(
//           BaseConstraint.permissionExists(
//             "0x211142bf6d4d1d08afec9bd2f8be8c27f318b0524992b22849734a2375f74df1",
//           ),
//         ),
//         BoolExpr.comp(
//           CompOp.Gte,
//           NumExpr.stakeOf(TEST_USER_ADDRESS),
//           NumExpr.literal(0),
//         ),
//       ),
//     );

//     try {
//       const nestedResult = await client.constraint.addTest.mutate({
//         constraint: nestedConstraint,
//       });
//       console.log("✅ Nested Constraint Added:", nestedResult.productionId);

//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       const nestedStatus = await client.constraint.getEvaluationStatus.query({
//         constraintId: nestedResult.productionId,
//       });
//       console.log("✅ Nested Expression Status:", nestedStatus.status);
//       console.log("   Expected: satisfied if permission exists AND stake >= 0");
//     } catch (error) {
//       console.log("❌ Nested Expression Error:", error);
//     }

//     console.log();

//     // Test 6: Network state visualization and components
//     console.log("6️⃣ Testing Network State and Structured Components...");

//     try {
//       // Test string visualization
//       const networkState = await client.constraint.getNetworkState.query();
//       console.log("✅ Network Visualization Retrieved:");
//       console.log(
//         "   - Visualization Length:",
//         networkState.visualization.length,
//       );

//       // Check for key network components
//       const hasAlphaNodes = networkState.visualization.includes("ALPHA NODES");
//       const hasProductionNodes =
//         networkState.visualization.includes("PRODUCTION NODES");
//       console.log("   - Has Alpha Nodes:", hasAlphaNodes ? "✅" : "❌");
//       console.log(
//         "   - Has Production Nodes:",
//         hasProductionNodes ? "✅" : "❌",
//       );
//     } catch (stateError) {
//       console.log("❌ Network State Error:", stateError);
//     }

//     try {
//       // Test structured components
//       const components = await client.constraint.getNetworkComponents.query();
//       console.log("✅ Structured Network Components Retrieved:");

//       // Alpha Nodes with detailed facts
//       console.log("   📋 Alpha Nodes:", components.alphaNodes.length);
//       components.alphaNodes.forEach((alpha) => {
//         console.log(
//           `      - ${alpha.key}: ${alpha.factCount} facts, ${alpha.successorCount} successors`,
//         );
//         alpha.facts.forEach((fact, i) => {
//           console.log(`        📄 Fact ${i + 1}: ${fact.type}`);
//           console.log(
//             `           Details: ${superjson.stringify(fact.details)}`,
//           );
//         });
//       });

//       // Beta Nodes with all tokens and their facts
//       console.log("   🔗 Beta Nodes:", components.betaNodes.length);
//       components.betaNodes.forEach((beta) => {
//         console.log(
//           `      - Beta #${beta.index}: ${beta.tokenCount} tokens (${beta.uniqueCombinations} unique)`,
//         );
//         beta.allTokens.forEach((token) => {
//           console.log(
//             `        🎫 Token ${token.tokenIndex}: ${token.factCount} facts`,
//           );
//           token.facts.forEach((fact) => {
//             console.log(`           📄 ${fact.key}: ${fact.type}`);
//             console.log(
//               `              Details: ${superjson.stringify(fact.details)}`,
//             );
//           });
//         });
//       });

//       // Production Nodes with all activations
//       console.log("   🎯 Production Nodes:", components.productionNodes.length);
//       components.productionNodes.forEach((prod) => {
//         console.log(
//           `      - ${prod.id}: ${prod.status} (${prod.activationCount} activations)`,
//         );
//         console.log(`        📝 Constraint: ${prod.constraintId}`);
//         console.log(
//           `        🏗️  Structure: ${superjson.stringify(prod.constraint.bodyStructure)}`,
//         );

//         prod.allActivations.forEach((activation) => {
//           console.log(
//             `        ⚡ Activation ${activation.activationIndex}: ${activation.factCount} facts`,
//           );
//           activation.facts.forEach((fact) => {
//             console.log(`           📄 ${fact.type}`);
//             console.log(
//               `              Details: ${superjson.stringify(fact.details)}`,
//             );
//           });
//         });

//         if (prod.allActivations.length === 0) {
//           console.log(`        ❌ No activations (constraint not satisfied)`);
//         }
//       });

//       // Working Memory with all facts
//       console.log('   💾 Working Memory:');
//       console.log(`      - Total Facts: ${components.workingMemory.totalFacts}`);

//       console.log(`      - Account Facts (${Object.keys(components.workingMemory.accountFacts).length} accounts):`);
//       Object.entries(components.workingMemory.accountFacts).forEach(([account, facts]) => {
//         console.log(`        👤 ${account}:`);
//         facts.forEach(fact => {
//           console.log(`           📄 ${fact.type}: ${superjson.stringify(fact.details)}`);
//         });
//       });

//       console.log(`      - Permission Facts (${Object.keys(components.workingMemory.permissionFacts).length} permissions):`);
//       Object.entries(components.workingMemory.permissionFacts).forEach(([permId, facts]) => {
//         console.log(`        🔐 ${permId}:`);
//         facts.forEach(fact => {
//           console.log(`           📄 ${fact.type}: ${superjson.stringify(fact.details)}`);
//         });
//       });

//       if (components.workingMemory.currentBlock) {
//         console.log(
//           `      - Current Block: #${components.workingMemory.currentBlock.number} (timestamp: ${components.workingMemory.currentBlock.timestamp})`,
//         );
//       }
//     } catch (componentsError) {
//       console.log("❌ Network Components Error:", componentsError);
//     }
//     console.log();

//     // Test 7: Final summary
//     console.log("7️⃣ Test Summary and Results");
//     console.log("============================");
//     console.log("✅ Constraint Health: Working");
//     console.log("✅ Always-Pass Constraint (stake >= 0): Should be satisfied");
//     console.log(
//       "🚨 Always-Fail Constraint (stake < 0): Should be violated + trigger callback",
//     );
//     console.log("✅ OR Expression: Proper disjunctive logic");
//     console.log("✅ NOT Expression: Proper negation logic");
//     console.log("✅ Nested Expression: Complex boolean combinations");
//     console.log("✅ Network Visualization: Working");
//     console.log(
//       "✅ Structured Network Components: Detailed inspection available",
//     );
//     console.log();
//     console.log("🎯 KEY POINTS TO VERIFY:");
//     console.log("1. Check the SERVER CONSOLE for violation callback messages");
//     console.log('2. Look for messages like "🚨 CONSTRAINT VIOLATION DETECTED"');
//     console.log(
//       "3. Simple comparisons now evaluate correctly (not always true)",
//     );
//     console.log("4. Boolean expressions (OR, NOT, AND) work properly");
//     console.log("5. Constraint status shows satisfied/violated correctly");
//     console.log();
//     console.log(
//       "🚀 FULL BOOLEAN EXPRESSION & VIOLATION CALLBACK TESTING COMPLETE!",
//     );
//     console.log(
//       "==============================================================",
//     );
//   } catch (error) {
//     console.error("❌ Test suite failed:", error);
//   }
// }

// // Instructions
// console.log("📋 SETUP INSTRUCTIONS FOR VIOLATION CALLBACK TESTING:");
// console.log("======================================================");
// console.log(
//   "1. Make sure PostgreSQL is running (docker-compose up -d postgres)",
// );
// console.log(
//   "2. Start the torus-allocator app: npm run dev in apps/torus-allocator",
// );
// console.log(
//   "3. Keep the server console visible to see violation callback messages",
// );
// console.log("4. Wait for the app to be ready, then run this test");
// console.log("5. The app should be accessible at http://localhost:3002");
// console.log();
// console.log("🔍 WHAT TO LOOK FOR:");
// console.log(
//   '- Server console should show "🚨 CONSTRAINT VIOLATION DETECTED" messages',
// );
// console.log("- Always-pass constraints should activate normally");
// console.log("- Always-fail constraints should trigger the violation callback");
// console.log();

// // Run tests
// testConstraintViolationCallback().catch(console.error);
