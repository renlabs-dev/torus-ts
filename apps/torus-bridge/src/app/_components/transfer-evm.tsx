import { convertH160ToSS58 } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import { Button, Card, CardContent } from "@torus-ts/ui";

export function TransferEVM() {
  const eth_addr = "0x7A3e007E28F1eFe4F5D3541375a026060Ec2ECe4";
  const evm_ss58_addr = convertH160ToSS58(eth_addr);
  const amount = 37;

  const { transfer } = useTorus();

  async function handleBridge() {
    await transfer({
      amount: `${amount}`,
      to: evm_ss58_addr,
      refetchHandler: () => Promise.resolve(),
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        Bridging: {amount} TOR to {eth_addr} through {evm_ss58_addr}
        <br></br>
        <Button onClick={handleBridge}>Bridge</Button>
      </CardContent>
    </Card>
  );
}
