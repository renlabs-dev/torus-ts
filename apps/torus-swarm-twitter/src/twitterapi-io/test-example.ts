import { KaitoTwitterAPI } from "./index.js";

// Example usage of the KaitoTwitterAPI client
async function example() {
  // Initialize the client
  const client = new KaitoTwitterAPI({
    apiKey: "your-api-key-here",
  });

  console.log("KaitoTwitterAPI client initialized");
  console.log("API Key Info:", client.getApiKeyInfo());

  try {
    // Example: Get user information
    const user = await client.users.getInfo({ userName: "jack" });
    if (user?.unavailable) {
      console.log(`   ⚠️  User is unavailable: ${user.message}`);
      console.log(`   📋 Reason: ${user.unavailableReason}\n`);
    } else if (user) {
      console.log(`User: ${user.name} (@${user.userName})`);
      console.log(`Followers: ${user.followers}, Following: ${user.following}`);
    }

    // Example: Search tweets
    const searchResults = await client.tweets.advancedSearch({
      query: "typescript OR javascript",
      queryType: "Latest",
    });
    console.log(`Found ${searchResults.tweets.length} tweets`);

    // Example: Login and create tweet
    const loginResult = await client.actions.login({
      user_name: "your_username",
      email: "your@email.com",
      password: "your_password",
      proxy: "http://username:password@proxy:port",
    });
    const { login_cookie } = loginResult;
    await client.actions.createTweet({
      text: "Hello from KaitoTwitterAPI! 🚀",
      login_cookie,
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

// Only run if this file is executed directly
// if (import.meta.main) {
//   example().catch(console.error);
// }

export { example };
