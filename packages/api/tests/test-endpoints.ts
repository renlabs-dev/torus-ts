#!/usr/bin/env tsx

import { constraintRouter } from './src/router/constraint/constraint';
import { ConstraintBuilder, BoolExpr, BaseConstraint, NumExpr } from '@torus-ts/dsl';

/**
 * Test script for tRPC constraint endpoints
 */
async function testConstraintEndpoints() {
  console.log('🧪 Testing Constraint tRPC Endpoints');
  console.log('=====================================\n');

  // Mock context for authenticated procedures
  const mockCtx = {
    // Add any required context properties here
  };

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResult = await constraintRouter.healthCheck.query({ 
      input: undefined, 
      ctx: mockCtx 
    });
    console.log('✅ Health Check Result:', JSON.stringify(healthResult, null, 2));
    console.log();

    // Test 2: Create a sample constraint using the helpers
    console.log('2️⃣ Creating Sample Constraint...');
    
    // Create a constraint: "Permission 'test-permission' must exist"
    const constraint = ConstraintBuilder.create(
      'test-permission',
      BoolExpr.base(BaseConstraint.permissionExists('test-permission'))
    );
    
    console.log('📝 Sample Constraint:', JSON.stringify(constraint, null, 2));
    console.log();

    // Test 3: Add constraint via JSON string
    console.log('3️⃣ Testing Add Constraint (JSON string)...');
    const constraintJson = JSON.stringify(constraint);
    
    try {
      const addResult = await constraintRouter.add.mutation({
        input: { constraint: constraintJson },
        ctx: mockCtx
      });
      console.log('✅ Add Constraint Result:', JSON.stringify(addResult, null, 2));
      console.log();

      // Test 4: Check activation
      console.log('4️⃣ Testing Check Activation...');
      const activationResult = await constraintRouter.checkActivation.query({
        input: { constraintId: addResult.productionId },
        ctx: mockCtx
      });
      console.log('✅ Activation Check Result:', JSON.stringify(activationResult, null, 2));
      console.log();

      // Test 5: Get activations
      console.log('5️⃣ Testing Get Activations...');
      const activationsResult = await constraintRouter.getActivations.query({
        input: { constraintId: addResult.productionId },
        ctx: mockCtx
      });
      console.log('✅ Get Activations Result:', JSON.stringify(activationsResult, null, 2));
      console.log();

    } catch (addError) {
      console.log('⚠️ Add Constraint Error (expected if no chain connection):', addError);
      console.log();
    }

    // Test 6: Add constraint via direct object
    console.log('6️⃣ Testing Add Constraint (direct object)...');
    
    // Create a different constraint with numeric comparison
    const numericConstraint = ConstraintBuilder.create(
      'stake-constraint',
      BoolExpr.comp('Gte', NumExpr.stakeOf('test-account'), NumExpr.literal(1000))
    );
    
    try {
      const addResult2 = await constraintRouter.add.mutation({
        input: { constraint: numericConstraint },
        ctx: mockCtx
      });
      console.log('✅ Add Constraint Result (object):', JSON.stringify(addResult2, null, 2));
      console.log();
    } catch (addError2) {
      console.log('⚠️ Add Constraint Error (expected if no chain connection):', addError2);
      console.log();
    }

    // Test 7: Network state visualization
    console.log('7️⃣ Testing Network State...');
    const networkStateResult = await constraintRouter.getNetworkState.query({
      input: undefined,
      ctx: mockCtx
    });
    console.log('✅ Network State Result:');
    console.log(networkStateResult.visualization);
    console.log();

    // Test 8: Invalid constraint JSON
    console.log('8️⃣ Testing Invalid Constraint JSON...');
    try {
      await constraintRouter.add.mutation({
        input: { constraint: '{"invalid": "json"}' },
        ctx: mockCtx
      });
    } catch (invalidError) {
      console.log('✅ Invalid JSON Error (expected):', invalidError.message);
      console.log();
    }

    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConstraintEndpoints().catch(console.error);
}

export { testConstraintEndpoints };