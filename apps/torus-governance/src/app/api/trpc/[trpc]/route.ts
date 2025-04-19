import { appRouter, createTRPCContext } from "@torus-ts/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { env } from "~/env";

/**
 * Configure basic CORS headers
 */
const setCorsHeaders = (res: Response) => {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Request-Method", "*");
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set("Access-Control-Allow-Headers", "*");
};

export const OPTIONS = () => {
  const response = new Response(null, {
    status: 204,
  });
  setCorsHeaders(response);
  return response;
};

const handler = async (req: Request) => {
  const [error, response] = await tryAsync(
    fetchRequestHandler({
      endpoint: "/api/trpc",
      router: appRouter,
      req,
      createContext: () =>
        createTRPCContext({
          session: null,
          headers: req.headers,
          jwtSecret: env("JWT_SECRET"),
          authOrigin: env("NEXT_PUBLIC_AUTH_ORIGIN"),
          allocatorAddress: env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"),
        }),
      onError({ error, path }) {
        console.error(`>>> tRPC Error on '${path}'`, error);
      },
    })
  );

  if (error !== undefined) {
    console.error("Error in tRPC request handler:", error);
    const errorResponse = new Response(
      JSON.stringify({
        message: "Internal Server Error in tRPC handler",
      }),
      { status: 500 }
    );
    setCorsHeaders(errorResponse);
    return errorResponse;
  }

  setCorsHeaders(response);
  return response;
};

export { handler as GET, handler as POST };
