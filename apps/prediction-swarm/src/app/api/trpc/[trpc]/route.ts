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

const handler = (req: Request) => {
  const response = fetchRequestHandler({
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
      }),
    onError:
      env("NEXT_PUBLIC_NODE_ENV") === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });

  // Since fetchRequestHandler returns a Promise<Response>, we need to handle it
  return Promise.resolve(response).then((res) => {
    setCorsHeaders(res);
    return res;
  });
};

export { handler as GET, handler as POST };
