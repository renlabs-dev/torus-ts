import { hexToString, stringToHex } from "@polkadot/util";
import { cryptoWaitReady, signatureVerify } from "@polkadot/util-crypto";
import { checkSS58 } from "@torus-network/sdk";
import { AUTH_REQ_SCHEMA } from "@torus-network/torus-utils/auth";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
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
  // cryptoWaitReady
  const [error, _success] = await tryAsync(cryptoWaitReady());
  // stringToHex
  const [hexError, dataHex] = trySync(() => stringToHex(JSON.stringify(data)));

  if (error !== undefined) {
    console.error(error.message);
    throw error;
  }
  if (hexError !== undefined) {
    console.error("Failed to convert data to hex:", hexError.message);
    throw hexError;
  }

  // signer
  const [error2, success2] = await tryAsync(signer(dataHex));
  if (error2 !== undefined) {
    console.error("Failed to sign data:", error2.message);
    throw error2;
  }
  const { signature, address } = success2;
  return {
    payload: dataHex,
    signature,
    address,
  };
};

export const verifySignedData = async (signedInput: SignedPayload) => {
  //CryptoWaitReady
  const [cryptoError, _] = await tryAsync(cryptoWaitReady());
  //SignatureVerify
  const [verifyError, result] = trySync(() =>
    signatureVerify(payload, signature, address),
  );
  //HexToString
  const [parseError, decoded] = trySync<unknown>(() =>
    JSON.parse(hexToString(payload)),
  );
  //AuthReqSchema
  const [validateError, validated] = trySync(() =>
    AUTH_REQ_SCHEMA.safeParse(decoded),
  );
  //CheckSS58 Address
  const [addressError, checkedAddress] = trySync(() => checkSS58(address));

  const { payload, signature, address } = signedInput;

  // Error handlers
  if (addressError !== undefined) {
    console.error("Failed to check SS58 address:", addressError.message);
    throw addressError;
  }
  if (cryptoError !== undefined) {
    console.error("Failed to verify signed data:", cryptoError.message);
    throw cryptoError;
  }
  if (verifyError !== undefined) {
    console.error("Failed during signature verification:", verifyError.message);
    throw verifyError;
  }
  if (!result.isValid) {
    throw new Error("Invalid signature");
  }
  if (parseError !== undefined) {
    console.error("Failed to parse payload:", parseError.message);
    throw parseError;
  }
  if (validateError !== undefined) {
    console.error("Failed during payload validation:", validateError.message);
    throw validateError;
  }
  if (!validated.success) {
    throw new Error(`Invalid payload: ${validated.error.message}`);
  }

  return { payload: validated.data, address: checkedAddress };
};
