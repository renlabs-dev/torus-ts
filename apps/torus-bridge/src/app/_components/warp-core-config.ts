// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// TODO - Fix the typescript errors in this file

import { warpRouteConfigs } from "@hyperlane-xyz/registry";
import type { WarpCoreConfig } from "@hyperlane-xyz/sdk";
import { WarpCoreConfigSchema, validateZodResult } from "@hyperlane-xyz/sdk";
import { objFilter, objMerge } from "@hyperlane-xyz/utils";
import { warpRouteWhitelist } from "~/consts/warp-route-whitelist";
import { WarpRoutesTs } from "~/consts/warp-routes";
import WarpRoutesYaml from "~/consts/warp-routes.yaml";

export function assembleWarpCoreConfig(): WarpCoreConfig {
  const resultYaml = WarpCoreConfigSchema.safeParse(WarpRoutesYaml);
  const configYaml = validateZodResult(resultYaml, "warp core yaml config");
  const resultTs = WarpCoreConfigSchema.safeParse(WarpRoutesTs);
  const configTs = validateZodResult(resultTs, "warp core typescript config");

  const filteredWarpRouteConfigs = warpRouteWhitelist
    ? filterToIds(warpRouteConfigs, warpRouteWhitelist)
    : warpRouteConfigs;

  const configValues = Object.values(filteredWarpRouteConfigs);

  const configTokens = configValues.flatMap((c) => c.tokens);
  const tokens = dedupeTokens([
    ...configTokens,
    ...configTs.tokens,
    ...configYaml.tokens,
  ]);

  if (!tokens.length)
    throw new Error(
      "No warp route configs provided. Please check your registry, warp route whitelist, and custom route configs for issues.",
    );

  const configOptions = configValues.flatMap((c) => c.options);
  const combinedOptions = [
    ...configOptions,
    configTs.options,
    configYaml.options,
  ];
  const options = combinedOptions.reduce<WarpCoreConfig["options"]>(
    (acc, o) => {
      if (!o || !acc) return acc;
      for (const key of Object.keys(o)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        acc[key] = (acc[key] || []).concat(o[key] || []);
      }
      return acc;
    },
    {},
  );

  return { tokens, options };
}

function filterToIds(
  config: Record<string, WarpCoreConfig>,
  idWhitelist: string[],
): Record<string, WarpCoreConfig> {
  return objFilter(config, (id, c): c is WarpCoreConfig =>
    idWhitelist.includes(id),
  );
}

// Separate warp configs may contain duplicate definitions of the same token.
// E.g. an IBC token that gets used for interchain gas in many different routes.
function dedupeTokens(
  tokens: WarpCoreConfig["tokens"],
): WarpCoreConfig["tokens"] {
  const idToToken: Record<string, WarpCoreConfig["tokens"][number]> = {};
  for (const token of tokens) {
    const id = `${token.chainName}|${token.addressOrDenom?.toLowerCase()}`;
    idToToken[id] = objMerge(idToToken[id] ?? {}, token);
  }
  return Object.values(idToToken);
}
