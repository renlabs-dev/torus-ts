import { Button } from "@torus-ts/ui/components/button";
import { ConnectAwareSubmitButton } from "~/app/_components/buttons/connect-aware-submit-button";
import { useChainDisplayName } from "~/hooks/chain/use-chain-display-name";
import { useIsAccountSanctioned } from "~/hooks/sanctioned/use-is-account-sanctioned";
import { useTokenTransfer } from "~/hooks/use-token-transfer";
import { useStore } from "~/utils/store";
import type { TransferFormValues } from "~/utils/types";
import { useFormikContext } from "formik";

export function ButtonSection({
  isReview,
  isValidating,
  setIsReview,
  resetForm,
}: Readonly<{
  isReview: boolean;
  isValidating: boolean;
  resetForm: () => void;
  setIsReview: (b: boolean) => void;
}>) {
  const { values } = useFormikContext<TransferFormValues>();
  const chainDisplayName = useChainDisplayName(values.destination);

  const isSanctioned = useIsAccountSanctioned();

  const onDoneTransactions = () => {
    setIsReview(false);
    setTransferLoading(false);
    resetForm();
  };
  const { triggerTransactions } = useTokenTransfer(onDoneTransactions);

  const { setTransferLoading } = useStore((s) => ({
    setTransferLoading: s.setTransferLoading,
  }));

  const triggerTransactionsHandler = async () => {
    if (isSanctioned) {
      return;
    }

    setIsReview(false);
    setTransferLoading(true);
    try {
      await triggerTransactions(values);
    } catch (error) {
      console.error(error);
    } finally {
      setTransferLoading(false);
    }
  };

  if (!isReview) {
    return (
      <ConnectAwareSubmitButton
        chainName={values.origin}
        text={isValidating ? "Validating..." : "Continue"}
      />
    );
  }

  return (
    <div className="mt-4 flex w-full items-center justify-between space-x-4">
      <Button
        className="w-full"
        type="button"
        variant="outline"
        onClick={() => setIsReview(false)}
      >
        <span>Edit</span>
      </Button>
      <Button
        className="w-full"
        type="button"
        color="accent"
        onClick={triggerTransactionsHandler}
      >
        {`Send to ${chainDisplayName}`}
      </Button>
    </div>
  );
}
