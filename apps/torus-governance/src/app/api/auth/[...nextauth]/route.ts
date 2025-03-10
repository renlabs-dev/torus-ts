import NextAuth from "next-auth";
<<<<<<< HEAD
import { authConfig } from "~/utils/auth-config";
=======
import { authConfig } from "~/utils/auth";
>>>>>>> 701128fe (add discord login button)

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
