"use server";

import { OAuthClient } from "./base";
import type { OAuthProvider } from "next-auth/providers/oauth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "~/env";

export async function oAuthSignIn(_provider: OAuthProvider) {
  console.log("oAuthSignIn called with provider:", _provider);

  const cookieStore = await cookies();
  console.log(
    "All cookies:",
    cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
  );

  const callbackUrl = cookieStore.get("next-auth.callback-url")?.value ?? "";
  console.log("Callback URL from cookies:", callbackUrl);

  console.log("DISCORD_CLIENT_ID:", env("DISCORD_CLIENT_ID"));
  console.log("DISCORD_REDIRECT_URL:", env("DISCORD_REDIRECT_URL"));

  const cookieOptions = {
    sessionToken: cookieStore.get("next-auth.session-token")?.value ?? "",
    callbackUrl,
    csrfToken: cookieStore.get("next-auth.csrf-token")?.value ?? "",
    pkceCodeVerifier: cookieStore.get("pkce.code_verifier")?.value ?? "",
    state: "",
    nonce: "",
  };

  console.log("Cookie options:", {
    ...cookieOptions,
    sessionToken: cookieOptions.sessionToken ? "PRESENT" : "MISSING",
    csrfToken: cookieOptions.csrfToken ? "PRESENT" : "MISSING",
    pkceCodeVerifier: cookieOptions.pkceCodeVerifier ? "PRESENT" : "MISSING",
  });

  const oauthClient = new OAuthClient();
  console.log("OAuthClient created");

  const authUrl = await oauthClient.createAuthUrl(cookieOptions);
  console.log("Generated auth URL:", authUrl);

  console.log("Redirecting to auth URL...");
  redirect(authUrl);
}
