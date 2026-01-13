/**
 * Hyperlane GraphQL utilities for fetching message IDs and explorer URLs
 */

import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { assert } from "tsafe";
import { EXPLORER_URLS } from "../hooks/fast-bridge-helpers";

const HYPERLANE_GRAPHQL_ENDPOINT = "https://explorer4.hasura.app/v1/graphql";

interface HyperlaneMessage {
  msg_id: string;
}

interface HyperlaneGraphQLResponse {
  data: {
    q0: HyperlaneMessage[];
    q1: HyperlaneMessage[];
    q2: HyperlaneMessage[];
    q3: HyperlaneMessage[];
    q4: HyperlaneMessage[];
    q5: HyperlaneMessage[];
    q6: HyperlaneMessage[];
  };
}

/**
 * Searches for a Hyperlane message ID and returns the explorer URL
 *
 * @param txHash - Transaction hash to search for (with or without 0x prefix)
 * @returns Hyperlane explorer URL if found, or null if not found
 */
export async function fetchHyperlaneExplorerUrl(
  txHash: string,
): Promise<string | null> {
  // Normalize txHash to bytea format (\\x...) for Hasura GraphQL filtering
  const normalizedHash = txHash.startsWith("0x")
    ? `\\x${txHash.slice(2)}`
    : `\\x${txHash}`;

  // Search in both Base (8453) and Torus (21000) as possible destinations
  const destinationChains = [8453, 21000];

  const query = `
    query ($search: bytea, $destinationChains: [Int!]) @cached(ttl: 5) {
      q0: message_view(where: {_and: [{destination_domain_id: {_in: $destinationChains}}, {sender: {_eq: $search}}]} order_by: {id: desc} limit: 50) { msg_id }
      q1: message_view(where: {_and: [{destination_domain_id: {_in: $destinationChains}}, {recipient: {_eq: $search}}]} order_by: {id: desc} limit: 50) { msg_id }
      q2: message_view(where: {_and: [{destination_domain_id: {_in: $destinationChains}}, {origin_tx_sender: {_eq: $search}}]} order_by: {id: desc} limit: 50) { msg_id }
      q3: message_view(where: {_and: [{destination_domain_id: {_in: $destinationChains}}, {destination_tx_sender: {_eq: $search}}]} order_by: {id: desc} limit: 50) { msg_id }
      q4: message_view(where: {_and: [{destination_domain_id: {_in: $destinationChains}}, {origin_tx_hash: {_eq: $search}}]} order_by: {id: desc} limit: 50) { msg_id }
      q5: message_view(where: {_and: [{destination_domain_id: {_in: $destinationChains}}, {destination_tx_hash: {_eq: $search}}]} order_by: {id: desc} limit: 50) { msg_id }
      q6: message_view(where: {_and: [{destination_domain_id: {_in: $destinationChains}}, {msg_id: {_eq: $search}}]} order_by: {id: desc} limit: 50) { msg_id }
    }
  `;

  // Fetch from Hyperlane GraphQL endpoint
  const [fetchError, response] = await tryAsync(
    fetch(HYPERLANE_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query,
        variables: {
          search: normalizedHash,
          destinationChains,
        },
      }),
    }),
  );

  if (fetchError !== undefined) {
    console.warn(
      "[fetchHyperlaneExplorerUrl] Failed to fetch from GraphQL:",
      fetchError.message,
    );
    return null;
  }

  if (!response.ok) {
    console.warn(
      `[fetchHyperlaneExplorerUrl] GraphQL request failed with status ${response.status}`,
    );
    return null;
  }

  // Parse response JSON
  const [parseError, data] = await tryAsync(
    response.json() as Promise<HyperlaneGraphQLResponse>,
  );

  if (parseError !== undefined) {
    console.warn(
      "[fetchHyperlaneExplorerUrl] Failed to parse GraphQL response:",
      parseError.message,
    );
    return null;
  }

  // Combine all query results
  const allMessages = [
    ...data.data.q0,
    ...data.data.q1,
    ...data.data.q2,
    ...data.data.q3,
    ...data.data.q4,
    ...data.data.q5,
    ...data.data.q6,
  ];

  if (allMessages.length === 0) {
    console.warn(
      `[fetchHyperlaneExplorerUrl] No message found for tx hash: ${txHash}`,
    );
    return null;
  }

  // Get the most recent message (first one since ordered by id desc)
  const message = allMessages[0];
  assert(message !== undefined, "Message should exist after length check");

  // Convert msg_id from GraphQL format (\\x...) to standard format (0x...)
  const msgId = message.msg_id.replace(/^\\+x/i, "0x").toLowerCase();

  // Return Hyperlane explorer URL with msg_id
  const explorerUrl = `${EXPLORER_URLS.TORUS_EVM_HYPERLANE}/${msgId}`;

  console.log(
    `[fetchHyperlaneExplorerUrl] Found message ID for tx ${txHash}:`,
    msgId,
  );

  return explorerUrl;
}
