import { Card, CardContent } from "@torus-ts/ui";
import { TransferTokenForm } from "./_components/transfer-token-form";

export function TransferToken() {
  return (
    <Card>
      <CardContent>
        <TransferTokenForm />
      </CardContent>
    </Card>
  );
}
