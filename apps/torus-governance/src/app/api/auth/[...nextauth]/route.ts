import { authConfig } from "~/utils/auth-config";
import NextAuth from "next-auth";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
