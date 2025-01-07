import { useAccount, useWalletClient } from "wagmi";

import type { SS58Address } from "@torus-ts/subspace";
import { convertH160ToSS58, withdrawFromTorusEvm } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import { Button, Card, CardContent } from "@torus-ts/ui";
import { toNano } from "@torus-ts/utils/subspace";

// export const torusTestnet: Chain = {
//   id: 21000, // Replace with your chain's ID
//   name: "TORUS EVM",
//   nativeCurrency: {
//     decimals: 18,
//     name: "eTORUS",
//     symbol: "eTORUS",
//   },
//   rpcUrls: {
//     default: {
//       http: ["https://api.testnet.torus.network"], // Replace with your chain's RPC URL
//     },
//     public: {
//       http: ["https://api.testnet.torus.network"], // Same as above or another public RPC
//     },
//   },
//   blockExplorers: {
//     default: {
//       name: "Explorer",
//       url: "https://blockscout.testnet.torus.network/", // Replace with your chain's block explorer URL
//     },
//   },
//   testnet: true, // Set to true if it's a testnet
// };

// import { createClient, http } from "viem";

// const config = createConfig({
//   chains: [torusTestnet],
//   client({ chain }) {
//     return createClient({
//       chain,
//       // transport: http(chain.rpcUrls.default.http[0]),
//       transport: http(),
//     });
//   },
// });

export function TransferEVM() {
  const user_input_eth_addr = "0x7A3e007E28F1eFe4F5D3541375a026060Ec2ECe4";
  const evm_ss58_addr = convertH160ToSS58(user_input_eth_addr);
  const amount = 10;
  const amount_rems = toNano(amount);

  const { transfer, selectedAccount } = useTorus();

  // const multiProvider = useMultiProvider();
  // const account = useEthereumAccount(multiProvider);

  const { data: walletClient } = useWalletClient();
  const { chain } = useAccount();
  if (walletClient == null || chain == null) {
    return <div>Loading...</div>;
  }

  console.log(chain);

  async function handleBridge() {
    await transfer({
      amount: `${amount}`,
      to: evm_ss58_addr,
      refetchHandler: () => Promise.resolve(),
    });
  }

  async function handleWithdraw() {
    if (walletClient == null || chain == null || selectedAccount == null) {
      throw new Error("Wallet client account is undefined");
    }
    const txHash = await withdrawFromTorusEvm(
      walletClient,
      chain,
      // user Torus address
      selectedAccount.address as SS58Address,
      amount_rems,
    );
    console.log("Transaction sent:", txHash);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        Bridging: {amount} TOR to {user_input_eth_addr} through {evm_ss58_addr}
        <br></br>
        <Button onClick={handleBridge}>Bridge</Button>
      </CardContent>
      <CardContent className="pt-6">
        Withdrawing: {amount} TOR to {selectedAccount?.address}
        <br></br>
        <Button onClick={handleWithdraw}>Withdraw</Button>
      </CardContent>
    </Card>
  );
}
