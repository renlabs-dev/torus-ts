import { Card, CardContent, CardHeader } from "@torus-ts/ui";
import { TransferTokenForm } from "./_components/transfer-token-form";

export function TransferToken() {
  return (
    <Card>
      <CardHeader>Torus Base Bridge</CardHeader>
      <CardContent>
        <TransferTokenForm />
      </CardContent>
    </Card>
  );
}
