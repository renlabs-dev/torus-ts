import { TransferTokenForm } from "../features/transfer/TransferTokenForm";
import { Card } from "./components/layout/Card";

export default function HomePage(): JSX.Element {
  return (
    <Card className="w-100 relative space-y-3 pt-4 sm:w-[31rem]">
      <TransferTokenForm />
    </Card>
  );
}
