import { ChevronIcon } from "@hyperlane-xyz/widgets";
import { useFormikContext } from "formik";
import { ConnectAwareSubmitButton } from "~/app/components/buttons/ConnectAwareSubmitButton";
import { SolidButton } from "~/app/components/buttons/SolidButton";
import { useChainDisplayName } from "~/features/chains/hooks";
import { useIsAccountSanctioned } from "~/features/sanctions/hooks/useIsAccountSanctioned";
import { useStore } from "~/features/store";
import type { TransferFormValues } from "~/utils/types";
import { useTokenTransfer } from "~/features/transfer/useTokenTransfer";

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
    <div className="mt-4 flex items-center justify-between space-x-4">
      <SolidButton
        type="button"
        color="primary"
        onClick={() => setIsReview(false)}
        classes="px-6 py-1.5"
        icon={
          <ChevronIcon direction="w" width={10} height={6} color="#FFFFFF" />
        }
      >
        <span>Edit</span>
      </SolidButton>
      <SolidButton
        type="button"
        color="accent"
        onClick={triggerTransactionsHandler}
        classes="flex-1 px-3 py-1.5"
      >
        {`Send to ${chainDisplayName}`}
      </SolidButton>
    </div>
  );
}
