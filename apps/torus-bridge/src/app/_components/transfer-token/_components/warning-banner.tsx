import { useFormikContext } from "formik";
import { ChainConnectionWarning } from "~/features/chains/ChainConnectionWarning";
import { ChainWalletWarning } from "~/features/chains/ChainWalletWarning";
import type { TransferFormValues } from "~/utils/types";

export function WarningBanners() {
  const { values } = useFormikContext<TransferFormValues>();
  return (
    <div className="max-h-10">
      <ChainWalletWarning origin={values.origin} />
      <ChainConnectionWarning
        origin={values.origin}
        destination={values.destination}
      />
    </div>
  );
}
