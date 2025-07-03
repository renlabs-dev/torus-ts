import { Button } from "@torus-ts/ui/components/button";
import { ConnectAwareSubmitButton } from "~/app/_components/buttons/connect-aware-submit-button";
import { useChainDisplayName } from "~/hooks/chain/use-chain-display-name";
import { useIsAccountSanctioned } from "~/hooks/sanctioned/use-is-account-sanctioned";
import { useTokenTransfer } from "~/hooks/use-token-transfer";
import { useStore } from "~/utils/store";
import { useTransferFormContext } from "../_components/transfer-form-context";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { FieldErrors } from "react-hook-form";
import type { TransferFormValues } from "~/utils/types";

export function ButtonSection({
  isReview,
  isValidating,
  setIsReview,
  resetForm,
  isValid,
  errors,
}: Readonly<{
  isReview: boolean;
  isValidating: boolean;
  resetForm: () => void;
  setIsReview: (b: boolean) => void;
  isValid: boolean;
  errors: FieldErrors<TransferFormValues>;
}>) {
  const { watch } = useTransferFormContext();
  const values = watch();
  const chainDisplayName = useChainDisplayName(values.destination);
  const setTransferLoading = useStore((s) => s.setTransferLoading);

  const isSanctioned = useIsAccountSanctioned();

  const onDoneTransactions = () => {
    setIsReview(false);
    setTransferLoading(false);
    resetForm();
  };
  const { triggerTransactions } = useTokenTransfer(onDoneTransactions);

  const triggerTransactionsHandler = async () => {
    if (isSanctioned) {
      return;
    }

    setIsReview(false);
    setTransferLoading(true);

    const [error] = await tryAsync(triggerTransactions(values));

    if (error !== undefined) {
      console.error("Error triggering transactions:", error);
    }

    setTransferLoading(false);
  };

  if (!isReview) {
    return (
      <ConnectAwareSubmitButton
        chainName={values.origin}
        text={isValidating ? "Validating..." : "Continue"}
        errors={errors}
        disabled={!isValid}
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
