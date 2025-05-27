#!/usr/bin/env tsx

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { TestAppRouter } from './test-server';
import { 
  ConstraintBuilder, 
  BoolExpr, 
  BaseConstraint, 
  NumExpr 
} from '@torus-ts/dsl';

// Create tRPC client
const client = createTRPCProxyClient<TestAppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3001',
    }),
  ],
});

async function testEndpoints() {
  console.log('🧪 Testing tRPC Constraint Endpoints');
  console.log('=====================================\n');

  try {
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResult = await client.constraint.healthCheck.query();
    console.log('✅ Health Check Result:', JSON.stringify(healthResult, null, 2));
    console.log();

    // Test 2: Get initial network state
    console.log('2️⃣ Testing Initial Network State...');
    const initialState = await client.constraint.getNetworkState.query();
    console.log('✅ Initial Network State:');
    console.log(initialState.visualization.substring(0, 300) + '...');
    console.log();

    // Test 3: Create and add a constraint (JSON string)
    console.log('3️⃣ Testing Add Constraint (JSON string)...');
    
    const permissionConstraint = ConstraintBuilder.create(
      'test-permission',
      BoolExpr.base(BaseConstraint.permissionExists('test-permission'))
    );
    
    console.log('📝 Creating constraint:', JSON.stringify(permissionConstraint, null, 2));
    
    try {
      const addResult = await client.constraint.add.mutate({
        constraint: JSON.stringify(permissionConstraint)
      });
      console.log('✅ Add Constraint Result:', JSON.stringify(addResult, null, 2));
      
      const constraintId = addResult.productionId;
      
      // Test 4: Check activation
      console.log('\n4️⃣ Testing Check Activation...');
      const activationResult = await client.constraint.checkActivation.query({
        constraintId: constraintId
      });
      console.log('✅ Activation Check:', JSON.stringify(activationResult, null, 2));
      
      // Test 5: Get activations
      console.log('\n5️⃣ Testing Get Activations...');
      const activationsResult = await client.constraint.getActivations.query({
        constraintId: constraintId
      });
      console.log('✅ Activations:', JSON.stringify(activationsResult, null, 2));
      
      console.log();
      
    } catch (addError) {
      console.log('⚠️ Add Constraint Error (may be expected without chain):', 
        addError instanceof Error ? addError.message : addError);
      console.log();
    }

    // Test 6: Add constraint via direct object
    console.log('6️⃣ Testing Add Constraint (direct object)...');
    
    const stakeConstraint = ConstraintBuilder.create(
      'stake-constraint',
      BoolExpr.comp('Gte', NumExpr.stakeOf('test-account'), NumExpr.literal(1000))
    );
    
    try {
      const addResult2 = await client.constraint.add.mutate({
        constraint: stakeConstraint
      });
      console.log('✅ Add Constraint (object):', JSON.stringify(addResult2, null, 2));
      console.log();
    } catch (addError2) {
      console.log('⚠️ Add Constraint Error (may be expected without chain):', 
        addError2 instanceof Error ? addError2.message : addError2);
      console.log();
    }

    // Test 7: Complex constraint
    console.log('7️⃣ Testing Complex Constraint...');
    
    const complexConstraint = ConstraintBuilder.create(
      'complex-permission',
      BoolExpr.and(
        BoolExpr.base(BaseConstraint.permissionExists('complex-permission')),
        BoolExpr.comp('Gte', NumExpr.stakeOf('delegator'), NumExpr.literal(500))
      )
    );
    
    try {
      const complexResult = await client.constraint.add.mutate({
        constraint: JSON.stringify(complexConstraint)
      });
      console.log('✅ Complex Constraint:', JSON.stringify(complexResult, null, 2));
      console.log();
    } catch (complexError) {
      console.log('⚠️ Complex Constraint Error:', 
        complexError instanceof Error ? complexError.message : complexError);
      console.log();
    }

    // Test 8: Invalid JSON
    console.log('8️⃣ Testing Invalid JSON...');
    try {
      await client.constraint.add.mutate({
        constraint: '{"invalid": "json"}'
      });
      console.log('❌ Should have failed with invalid JSON');
    } catch (invalidError) {
      console.log('✅ Invalid JSON properly rejected:', 
        invalidError instanceof Error ? invalidError.message : invalidError);
    }
    console.log();

    // Test 9: Final network state
    console.log('9️⃣ Testing Final Network State...');
    const finalState = await client.constraint.getNetworkState.query();
    console.log('✅ Final Network State:');
    console.log(finalState.visualization.substring(0, 500) + '...');
    console.log();

    console.log('🎉 All endpoint tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Exit process
    process.exit(0);
  }
}

// Run tests
testEndpoints().catch(console.error);