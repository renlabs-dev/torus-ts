import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { env } from "~/env";

export const authConfig: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: env("DISCORD_CLIENT_ID"),
      clientSecret: env("DISCORD_CLIENT_SECRET"),
      // Specify the exact callback URL to match what's registered in Discord
      authorization: {
        params: {
          // Always include the email scope as well
          scope: "identify email",
        },
      },
    }),
  ],
  debug: env("NODE_ENV") === "development",
  logger: {
    error: (code, metadata) => {
      console.error(`NextAuth Error [${code}]:`, metadata);
    },
    warn: (code) => {
      console.warn(`NextAuth Warning [${code}]`);
    },
    debug: (code, metadata) => {
      if (env("NODE_ENV") === "development") {
        console.log(`NextAuth Debug [${code}]:`, metadata);
      }
    },
  },
  callbacks: {
    jwt({ token, account, profile }) {
      console.log(
        "JWT Callback - Account:",
        account
          ? {
              provider: account.provider,
              type: account.type,
            }
          : "No account",
      );

      console.log(
        "JWT Callback - Profile:",
        profile ? "Present" : "Not present",
      );

      if (account?.provider === "discord" && profile) {
        const discordProfile = profile as { id: string };
        token.discordId = discordProfile.id;
        console.log("Added discordId to token:", discordProfile.id);
      }
      return token;
    },
    session({ session, token }) {
      console.log("Session Callback - Token has discordId:", !!token.discordId);

      return {
        ...session,
        user: {
          ...session.user,
          discordId: token.discordId,
        },
      };
    },
  },
};
