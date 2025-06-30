import { spawn } from 'child_process';
import { runTests } from './test-client.js';

// Helper to wait for server to be ready
function waitForServer(url: string, timeout = 10000): Promise<void> {
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

async function runServerClientTest() {
  console.log('🚀 Starting server-client integration test...\n');
  
  // Start the test server
  console.log('📡 Starting test server...');
  const serverProcess = spawn('node', ['--loader', 'tsx/esm', './src/__tests__/test-server.ts'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  
  try {
    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await waitForServer('http://localhost:3001');
    console.log('✅ Server is ready!\n');
    
    // Run client tests
    console.log('🧪 Running client tests...');
    await runTests();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Clean up: kill the server process
    console.log('\n🛑 Stopping test server...');
    serverProcess.kill();
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runServerClientTest().catch(console.error);
}