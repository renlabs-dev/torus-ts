import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { appRouter, createTRPCContext } from "@torus-ts/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
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

/**
 * Create a JSON error response for failed requests
 */
const createErrorResponse = (error: Error): Response => {
  const errorResponse = new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      },
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  setCorsHeaders(errorResponse);
  return errorResponse;
};

const handler = async (req: Request) => {
  // Wrap in async IIFE to catch both synchronous and asynchronous errors
  const [error, response] = await tryAsync(
    (async () =>
      fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        createContext: () =>
          createTRPCContext({
            session: null,
            headers: req.headers,
            jwtSecret: env("JWT_SECRET"),
            authOrigin: env("NEXT_PUBLIC_AUTH_ORIGIN"),
            allocatorAddress: env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"),
            predictionAppAddress: env("PREDICTION_APP_ADDRESS"),
            permissionGrantorAddress: env("PERMISSION_GRANTOR_ADDRESS"),
          }),
        onError:
          env("NEXT_PUBLIC_NODE_ENV") === "development"
            ? ({ path, error }) => {
                console.error(
                  `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
                );
              }
            : undefined,
      }))(),
  );

  if (error !== undefined) {
    console.error("tRPC handler error:", error);
    return createErrorResponse(error);
  }

  setCorsHeaders(response);
  return response;
};

export { handler as GET, handler as POST };
