import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { env } from "~/env";

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
        const discordProfile = profile as { id: string };
        token.discordId = discordProfile.id;
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
