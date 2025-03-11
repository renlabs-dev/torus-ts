import type { CookiesOptions } from "next-auth";
import { env } from "~/env";

export class OAuthClient {
  private get redirectURL() {
    try {
      const redirectUrl = env("DISCORD_REDIRECT_URL");
      console.log("Base redirect URL from env:", redirectUrl);

      if (!redirectUrl) {
        console.error("DISCORD_REDIRECT_URL is not defined");
        throw new Error("DISCORD_REDIRECT_URL is not defined");
      }

      // For Discord callback, we need to ensure the URL points to /api/auth/callback/discord
      const url = new URL("/api/auth/callback/discord", redirectUrl);
      console.log("Constructed redirect URL for OAuth:", url.toString());
      return url;
    } catch (error) {
      console.error("Error creating redirect URL:", error);
      throw error;
    }
  }

  createAuthUrl(_cookies: CookiesOptions) {
    try {
      console.log("Creating auth URL with cookies:", {
        ..._cookies,
        sessionToken: _cookies.sessionToken ? "PRESENT" : "MISSING",
        csrfToken: _cookies.csrfToken ? "PRESENT" : "MISSING",
        pkceCodeVerifier: _cookies.pkceCodeVerifier ? "PRESENT" : "MISSING",
      });

      const url = new URL("https://discord.com/api/oauth2/authorize");
      const clientId = env("DISCORD_CLIENT_ID");
      console.log("Client ID:", clientId);

      if (!clientId) {
        console.error("DISCORD_CLIENT_ID is not defined");
        throw new Error("DISCORD_CLIENT_ID is not defined");
      }

      const finalRedirectUri = this.redirectURL.toString();
      console.log("Final redirect URI:", finalRedirectUri);

      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", finalRedirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "identify email");

      // If there's a callback URL in cookies, we can use state to redirect there after auth
      if (_cookies.callbackUrl) {
        console.log("Setting state with callback URL:", _cookies.callbackUrl);
        url.searchParams.set("state", encodeURIComponent(_cookies.callbackUrl));
      }

      const authUrl = url.toString();
      console.log("Generated auth URL:", authUrl);
      return authUrl;
    } catch (error) {
      console.error("Error in createAuthUrl:", error);
      throw error;
    }
  }
}
