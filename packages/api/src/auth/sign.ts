import { Keyring } from "@polkadot/api";
import { hexToString, hexToU8a, stringToHex, u8aToHex } from "@polkadot/util";
import { cryptoWaitReady, signatureVerify } from "@polkadot/util-crypto";
import { checkSS58 } from "@torus-network/sdk/types";
import { AUTH_REQ_SCHEMA } from "@torus-network/torus-utils/auth";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { z } from "zod";

export const SIGNED_PAYLOAD_SCHEMA = z.object({
  payload: z.string(),
  signature: z.string(),
  address: z.string(),
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
  if (error !== undefined) {
    console.error(error.message);
    throw error;
  }

  // stringToHex
  const [hexError, dataHex] = trySync(() => stringToHex(JSON.stringify(data)));
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
  const { payload, signature, address } = signedInput;

  //CryptoWaitReady
  const [cryptoError, _] = await tryAsync(cryptoWaitReady());
  if (cryptoError !== undefined) {
    console.error("Failed to verify signed data:", cryptoError.message);
    throw cryptoError;
  }

  //SignatureVerify
  const [verifyError, result] = trySync(() =>
    signatureVerify(payload, signature, address),
  );
  if (verifyError !== undefined) {
    console.error("Failed during signature verification:", verifyError.message);
    throw verifyError;
  }

  //HexToString
  const [parseError, decoded] = trySync<unknown>(() =>
    JSON.parse(hexToString(payload)),
  );
  if (parseError !== undefined) {
    console.error("Failed to parse payload:", parseError.message);
    throw parseError;
  }

  //AuthReqSchema
  const [validateError, validated] = trySync(() =>
    AUTH_REQ_SCHEMA.safeParse(decoded),
  );
  if (validateError !== undefined) {
    console.error("Failed during payload validation:", validateError.message);
    throw validateError;
  }

  //CheckSS58 Address
  const [addressError, checkedAddress] = trySync(() => checkSS58(address));
  if (addressError !== undefined) {
    console.error("Failed to check SS58 address:", addressError.message);
    throw addressError;
  }

  if (!result.isValid) {
    throw new Error("Invalid signature");
  }
  if (!validated.success) {
    throw new Error(`Invalid payload: ${validated.error.message}`);
  }

  return { payload: validated.data, address: checkedAddress };
};

/**
 * Creates a signing function from a mnemonic for signing hashes.
 *
 * @param mnemonic - SR25519 mnemonic phrase
 * @returns Function that signs a hash string and returns hex signature
 */
export async function createHashSigner(
  mnemonic: string,
): Promise<(hash: string) => string> {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: "sr25519" });
  const keypair = keyring.addFromUri(mnemonic);

  return (hash: string): string => {
    const hashBytes = hexToU8a(hash);
    const signature = keypair.sign(hashBytes);
    return u8aToHex(signature);
  };
}
