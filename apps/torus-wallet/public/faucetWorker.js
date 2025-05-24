importScripts('https://cdn.jsdelivr.net/npm/js-sha3@0.8.0/build/sha3.min.js');
const { keccak256 } = self;

console.log("start");

function hexToU8a(hex) {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function keccak256AsU8a(data) {
  const hex = keccak256(data);
  return hexToU8a(hex);
}

const difficulty = 1000000n;

function u256FromBytes(bytes) {
  let result = 0n;
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    result += BigInt(bytes[i]) << (8n * BigInt(len - 1 - i));
  }
  return result;
}

function meetsDifficulty(data) {
  if (data.length !== 32) throw new Error("Hash must be 32 bytes");

  const numHash = u256FromBytes(data);
  const maxU256 = (1n << 256n) - 1n;
  const product = numHash * difficulty;
  return product <= maxU256;
}

function createHash(blockData, nonce, address) {
  const blockAndKeyBytes = new Uint8Array(64);

  if (blockData.blockHash.length !== 32) {
    throw new Error("block_hash_bytes must be exactly 32 bytes");
  }

  const keyBytes32 = address.slice(0, 32);
  if (keyBytes32.length !== 32) {
    throw new Error("Key is smaller than 32 bytes");
  }

  blockAndKeyBytes.set(blockData.blockHash, 0);
  blockAndKeyBytes.set(keyBytes32, 32);

  const blockAndKeyHash = keccak256AsU8a(blockAndKeyBytes);

  const dataBytes = new Uint8Array(40);
  dataBytes.set(nonce, 0);
  dataBytes.set(blockAndKeyHash, 8);

  return keccak256AsU8a(dataBytes);
}

let mining = false;
let currentBlockData = null;
let currentAddress = null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

self.onmessage = async (e) => {
  if (e.data.type === 'start') {
    currentBlockData = {
      blockHash: new Uint8Array(e.data.blockData.blockHash),
      blockNumber: e.data.blockData.blockNumber,
    };
    currentAddress = new Uint8Array(e.data.decodedAddress);

    if (!mining) {
      mining = true;
      await mineLoop();
    }
  } else if (e.data.type === 'updateBlock') {
    currentBlockData = {
      blockHash: new Uint8Array(e.data.blockData.blockHash),
      blockNumber: e.data.blockData.blockNumber,
    };
    mining = false; // stop current mining loop
    mining = true;  // restart
    await mineLoop();
  }
};

async function mineLoop() {
  while (mining) {
    const nonce = new Uint8Array(8);
    crypto.getRandomValues(nonce);

    const hash = createHash(currentBlockData, nonce, currentAddress);

    if (meetsDifficulty(hash)) {
      self.postMessage({ nonce: Array.from(nonce), hash: Array.from(hash), blockNumber: currentBlockData.blockNumber });
      mining = false;
      break;
    }

    // Yield to event loop to handle messages
    await sleep(0);
  }
}