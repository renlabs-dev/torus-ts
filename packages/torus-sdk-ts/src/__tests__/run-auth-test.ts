import { spawn } from 'child_process';
import { runAuthenticatedTests } from './test-client-auth.js';

// Helper to wait for server to be ready
function waitForServer(url: string, timeout = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkServer = async () => {
      try {
        const response = await fetch(`${url}/docs`);
        if (response.ok) {
          resolve();
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error('Server failed to start within timeout'));
        return;
      }
      
      setTimeout(checkServer, 500);
    };
    
    checkServer();
  });
}

async function runAuthenticatedServerClientTest() {
  console.log('🚀 Starting authenticated server-client integration test...\n');
  
  // Start the authenticated test server
  console.log('📡 Starting authenticated test server...');
  const serverProcess = spawn('node', ['--import', 'tsx/esm', './src/__tests__/test-server-auth.ts'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  
  try {
    // Wait for server to be ready
    console.log('⏳ Waiting for authenticated server to be ready...');
    await waitForServer('http://localhost:3002');
    console.log('✅ Authenticated server is ready!\n');
    
    // Run authenticated client tests
    console.log('🧪 Running authenticated client tests...');
    await runAuthenticatedTests();
    
    console.log('\n✅ All authenticated tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Authenticated test failed:', error);
  } finally {
    // Clean up: kill the server process
    console.log('\n🛑 Stopping authenticated test server...');
    serverProcess.kill();
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthenticatedServerClientTest().catch(console.error);
}