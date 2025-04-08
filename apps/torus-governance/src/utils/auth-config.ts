import { env } from "~/env";
import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authConfig: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: env("DISCORD_CLIENT_ID"),
      clientSecret: env("DISCORD_CLIENT_SECRET"),
      authorization: {
        params: {
          scope: "identify email",
        },
      },
    }),
  ],
  callbacks: {
    jwt({ token, account, profile }) {
      if (account?.provider === "discord" && profile) {
        if (
          typeof profile === "object" &&
          "id" in profile &&
          typeof profile.id === "string"
        ) {
          token.discordId = profile.id;
        }
      }

      return token;
    },
    session({ session, token }) {
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
