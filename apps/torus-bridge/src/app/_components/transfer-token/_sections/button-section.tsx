import { ChevronIcon } from "@hyperlane-xyz/widgets";
import { useFormikContext } from "formik";
import { ConnectAwareSubmitButton } from "~/app/_components/buttons/connect-aware-submit-button";

import { useStore } from "~/utils/store";
import type { TransferFormValues } from "~/utils/types";
import { useTokenTransfer } from "~/hooks/use-token-transfer";
import { useIsAccountSanctioned } from "~/hooks/sanctioned/use-is-account-sanctioned";
import { useChainDisplayName } from "~/hooks/chain/use-chain-display-name";
import { Button } from "@torus-ts/ui";

export function ButtonSection({
  isReview,
  isValidating,
  setIsReview,
}: {
  isReview: boolean;
  isValidating: boolean;
  setIsReview: (b: boolean) => void;
}) {
  const { values } = useFormikContext<TransferFormValues>();
  const chainDisplayName = useChainDisplayName(values.destination);

  const isSanctioned = useIsAccountSanctioned();

  const onDoneTransactions = () => {
    setIsReview(false);
    setTransferLoading(false);
    // resetForm();
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
    await triggerTransactions(values);
  };

  if (!isReview) {
    return (
      <ConnectAwareSubmitButton
        chainName={values.origin}
        text={isValidating ? "Validating..." : "Continue"}
        classes="mt-4 px-3 py-1.5"
      />
    );
  }

  return (
    <div className="mt-4 flex w-full items-center justify-between space-x-4">
      <Button
        className="w-full"
        type="button"
        color="primary"
        onClick={() => setIsReview(false)}
      >
        <ChevronIcon direction="w" width={10} height={6} color="#FFFFFF" />
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
