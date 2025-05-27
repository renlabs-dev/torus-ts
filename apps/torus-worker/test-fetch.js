// A simple fetch-based client for testing our tRPC API

async function testApi() {
  try {
    // Test the hello endpoint without parameters
    const helloResponse = await fetch('http://localhost:3100/trpc/portal.hello');
    const helloResult = await helloResponse.json();
    console.log('Hello result:', helloResult);
    
    // Test the helloWithInput endpoint with a name
    const encodedInput = encodeURIComponent(JSON.stringify({ name: 'Jairo' }));
    const helloWithInputResponse = await fetch(`http://localhost:3100/trpc/portal.helloWithInput?input=${encodedInput}`);
    const helloWithInputResult = await helloWithInputResponse.json();
    console.log('Hello with input result:', helloWithInputResult);
    
    // Test the dslTest endpoint
    const dslTestResponse = await fetch('http://localhost:3100/trpc/portal.dslTest');
    const dslTestResult = await dslTestResponse.json();
    console.log('DSL test result:', dslTestResult);
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testApi();