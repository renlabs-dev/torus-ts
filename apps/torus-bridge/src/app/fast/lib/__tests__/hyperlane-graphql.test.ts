import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchHyperlaneExplorerUrl } from "./hyperlane-graphql";
import { EXPLORER_URLS } from "../hooks/fast-bridge-helpers";

// Mock fetch globally
global.fetch = vi.fn();

describe("fetchHyperlaneExplorerUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return explorer URL when message is found", async () => {
    const txHash = "0x1234567890abcdef1234567890abcdef12345678";
    const msgId = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            q0: [],
            q1: [],
            q2: [],
            q3: [],
            q4: [{ msg_id: `\\x${msgId.slice(2)}` }],
            q5: [],
            q6: [],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchHyperlaneExplorerUrl(txHash);

    expect(result).toBe(
      `${EXPLORER_URLS.TORUS_EVM_HYPERLANE}/${msgId.toLowerCase()}`,
    );
  });

  it("should handle txHash with 0x prefix", async () => {
    const txHash = "0xabcd1234";
    const msgId = "0x1234567890abcdef";

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            q0: [{ msg_id: `\\x${msgId.slice(2)}` }],
            q1: [],
            q2: [],
            q3: [],
            q4: [],
            q5: [],
            q6: [],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchHyperlaneExplorerUrl(txHash);

    expect(result).toBe(
      `${EXPLORER_URLS.TORUS_EVM_HYPERLANE}/${msgId.toLowerCase()}`,
    );
  });

  it("should handle txHash without 0x prefix", async () => {
    const txHash = "abcd1234";
    const msgId = "0x1234567890abcdef";

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            q0: [{ msg_id: `\\x${msgId.slice(2)}` }],
            q1: [],
            q2: [],
            q3: [],
            q4: [],
            q5: [],
            q6: [],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchHyperlaneExplorerUrl(txHash);

    expect(result).toBe(
      `${EXPLORER_URLS.TORUS_EVM_HYPERLANE}/${msgId.toLowerCase()}`,
    );
  });

  it("should return null when no messages found", async () => {
    const txHash = "0x1234567890abcdef";

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            q0: [],
            q1: [],
            q2: [],
            q3: [],
            q4: [],
            q5: [],
            q6: [],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchHyperlaneExplorerUrl(txHash);

    expect(result).toBeNull();
  });

  it("should return null when fetch fails", async () => {
    const txHash = "0x1234567890abcdef";

    vi.mocked(fetch).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const result = await fetchHyperlaneExplorerUrl(txHash);

    expect(result).toBeNull();
  });

  it("should return null when response status is not ok", async () => {
    const txHash = "0x1234567890abcdef";

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500 },
      ),
    );

    const result = await fetchHyperlaneExplorerUrl(txHash);

    expect(result).toBeNull();
  });

  it("should return null when JSON parsing fails", async () => {
    const txHash = "0x1234567890abcdef";

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("invalid json", { status: 200 }),
    );

    const result = await fetchHyperlaneExplorerUrl(txHash);

    expect(result).toBeNull();
  });

  it("should use correct destination chain IDs in query", async () => {
    const txHash = "0x1234567890abcdef";
    const msgId = "0xabcd1234";

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            q0: [],
            q1: [],
            q2: [],
            q3: [],
            q4: [{ msg_id: `\\x${msgId.slice(2)}` }],
            q5: [],
            q6: [],
          },
        }),
        { status: 200 },
      ),
    );

    await fetchHyperlaneExplorerUrl(txHash);

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]?.body as string);

    expect(body.variables.destinationChains).toEqual([8453, 21000]);
  });

  it("should convert msg_id from bytea to hex format", async () => {
    const txHash = "0x1234567890abcdef";
    const byteaMsgId = "\\xabcdef1234567890";
    const expectedHexMsgId = "0xabcdef1234567890".toLowerCase();

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            q0: [{ msg_id: byteaMsgId }],
            q1: [],
            q2: [],
            q3: [],
            q4: [],
            q5: [],
            q6: [],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchHyperlaneExplorerUrl(txHash);

    expect(result).toBe(
      `${EXPLORER_URLS.TORUS_EVM_HYPERLANE}/${expectedHexMsgId}`,
    );
  });

  it("should use first message when multiple are found", async () => {
    const txHash = "0x1234567890abcdef";
    const msgId1 = "0xfirst1234567890";
    const msgId2 = "0xsecond567890abc";

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            q0: [
              { msg_id: `\\x${msgId1.slice(2)}` },
              { msg_id: `\\x${msgId2.slice(2)}` },
            ],
            q1: [],
            q2: [],
            q3: [],
            q4: [],
            q5: [],
            q6: [],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchHyperlaneExplorerUrl(txHash);

    expect(result).toBe(
      `${EXPLORER_URLS.TORUS_EVM_HYPERLANE}/${msgId1.toLowerCase()}`,
    );
  });
});
