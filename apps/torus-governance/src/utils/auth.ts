import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { env } from "~/env";

// Update with your actual path

export const authConfig: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: env("DISCORD_CLIENT_ID"),
      clientSecret: env("DISCORD_CLIENT_SECRET"),
    }),
  ],
};
