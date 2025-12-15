import { Elysia } from "elysia";
import type { AppContext } from "../context";

export const contextPlugin = (context: AppContext) =>
  new Elysia({ name: "context" })
    .decorate("db", context.db)
    .decorate("wsAPI", context.wsAPI)
    .decorate("permissionCache", context.permissionCache)
    .decorate("serverSignHash", context.serverSignHash)
    .decorate("logger", context.logger)
    .decorate("env", context.env)
    .decorate("appAgentName", context.appAgentName);

export type ContextApp = ReturnType<typeof contextPlugin>;
