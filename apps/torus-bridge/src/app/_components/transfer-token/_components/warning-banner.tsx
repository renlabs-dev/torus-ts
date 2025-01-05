import { useFormikContext } from "formik";

import type { TransferFormValues } from "~/utils/types";
import { ChainWalletWarning } from "../../chains/chain-wallet-warning";
import { ChainConnectionWarning } from "../../chains/chain-connection-warning";

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
