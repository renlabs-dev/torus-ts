import type { ContentListParams } from "./api-schemas";

/**
 * Builds URLSearchParams for content list API endpoints
 * Handles common parameters like agent_address, time windows, pagination, search, and sorting
 *
 * @param params - Validated ContentListParams object
 * @returns URLSearchParams object ready for API requests
 */
export function buildContentListSearchParams(
  params: ContentListParams,
): URLSearchParams {
  const searchParams = new URLSearchParams();

  // Agent filter
  if (params.agent_address) {
    searchParams.set("agent_address", params.agent_address);
  }

  // Time window filters
  if (params.from) {
    searchParams.set("from", params.from);
  }
  if (params.to) {
    searchParams.set("to", params.to);
  }

  // Pagination
  if (params.limit) {
    searchParams.set("limit", params.limit.toString());
  }
  if (params.offset) {
    searchParams.set("offset", params.offset.toString());
  }

  // Search functionality
  if (params.search) {
    searchParams.set("search", params.search);
  }

  // Sorting with default to "desc" (newest first)
  if (params.sort_order) {
    searchParams.set("sort_order", params.sort_order);
  } else {
    searchParams.set("sort_order", "desc");
  }

  return searchParams;
}

/**
 * Builds the complete URL with search parameters for content list endpoints
 *
 * @param baseEndpoint - Base API endpoint (e.g., "predictions/list")
 * @param params - Validated ContentListParams object
 * @returns Complete URL string with query parameters
 */
export function buildContentListUrl(
  baseEndpoint: string,
  params: ContentListParams,
): string {
  const searchParams = buildContentListSearchParams(params);
  const queryString = searchParams.toString();

  return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
}
