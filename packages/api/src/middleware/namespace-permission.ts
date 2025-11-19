import { trySync } from "@torus-network/torus-utils/try-catch";
import { getPermissionCache } from "../services/permission-cache";
import type { AuthenticatedTRPCContext } from "../trpc";
import { authenticatedProcedure } from "../trpc";

/**
 * Creates a tRPC procedure that requires namespace permissions.
 *
 * Returns a procedure that combines authentication + namespace permission checks.
 *
 * @param namespacePaths - Array of namespace paths required
 * @returns An authenticated procedure with permission checks
 *
 * @example
 * ```ts
 * const filterProcedure = requireNamespacePermission(["prediction.filter"]);
 *
 * export const myRouter = createTRPCRouter({
 *   getTweets: filterProcedure.input(...).query(...),
 * });
 * ```
 */
export const requireNamespacePermission = (namespacePaths: string[]) => {
  return authenticatedProcedure.use(async (opts) => {
    // Create typed authenticated context (same pattern as authenticatedProcedure)
    const [ctxError, permissionCtx] = trySync<AuthenticatedTRPCContext>(() => {
      // authenticatedProcedure already guarantees sessionData exists
      const permissionCache = getPermissionCache(
        opts.ctx.wsAPI,
        opts.ctx.permissionGrantorAddress,
      );

      // Check all required permissions
      for (const path of namespacePaths) {
        permissionCache.checkPermission(opts.ctx.sessionData.userKey, path);
      }

      // Return authenticated context with sessionData guaranteed non-null
      return {
        ...opts.ctx,
        sessionData: opts.ctx.sessionData,
      };
    });

    if (ctxError !== undefined) {
      throw ctxError;
    }

    // Pass the typed context to the next middleware/handler
    return opts.next({
      ctx: permissionCtx,
    });
  });
};
