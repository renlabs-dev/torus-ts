import { hexToString, stringToHex } from "@polkadot/util";
import { cryptoWaitReady, signatureVerify } from "@polkadot/util-crypto";
import { checkSS58 } from "@torus-network/sdk";
import { AUTH_REQ_SCHEMA } from "@torus-ts/utils/auth";
import { z } from "zod";

export const SIGNED_PAYLOAD_SCHEMA = z.object({
  payload: z.string({ description: "in hex" }),
  signature: z.string({ description: "in hex" }),
  address: z.string({ description: "in hex" }),
});

export type SignedPayload = z.infer<typeof SIGNED_PAYLOAD_SCHEMA>;

export const signData = async <T>(
  signer: (
    msgHex: `0x${string}`,
  ) => Promise<{ signature: `0x${string}`; address: string }>,
  data: T,
): Promise<SignedPayload> => {
  await cryptoWaitReady();

  const dataHex = stringToHex(JSON.stringify(data));
  const { signature, address } = await signer(dataHex);
  return {
    payload: dataHex,
    signature,
    address,
  };
};

export const verifySignedData = async (signedInput: SignedPayload) => {
  await cryptoWaitReady();

  const { payload, signature, address } = signedInput;

  const result = signatureVerify(payload, signature, address);
  if (!result.isValid) {
    throw new Error("Invalid signature");
  }

  const decoded = JSON.parse(hexToString(payload)) as unknown;
  const validated = AUTH_REQ_SCHEMA.safeParse(decoded);

  if (!validated.success) {
    throw new Error(`Invalid payload: ${validated.error.message}`);
  }
  return { payload: validated.data, address: checkSS58(address) };
};
