// Simple client test to call the hello endpoint

async function testHelloEndpoint() {
  const serverUrl = 'http://localhost:3001';
  
  try {
    const response = await fetch(`${serverUrl}/hello`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'World'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Success:', result);
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Test with different names
async function runTests() {
  console.log('🚀 Starting client tests...\n');
  
  const testCases = ['World', 'Alice', 'Bob', 'Torus'];
  
  for (const name of testCases) {
    try {
      console.log(`Testing with name: "${name}"`);
      const response = await fetch('http://localhost:3001/hello', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name })
      });

      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log(`Raw response: "${responseText}"`);
      
      try {
        const result = JSON.parse(responseText);
        console.log(`Result: ${result.message}`);
        console.log(`Timestamp: ${result.timestamp}\n`);
      } catch (parseError) {
        console.error(`JSON parse error for response: "${responseText}"`);
        console.error(`Parse error:`, parseError);
      }
    } catch (error) {
      console.error(`Failed for name "${name}":`, error);
    }
  }
}

// Export for programmatic use
export { testHelloEndpoint, runTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}