import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@torus-ts/ui/components/alert-dialog";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useUsdPrice } from "~/context/usd-price-provider";
import { convertTORUSToUSD } from "~/utils/helpers";

export interface ReviewTransactionDialogHandle {
  openDialog: () => void;
}

interface TransactionDetail {
  label: string;
  value: string | undefined;
  currency?: string;
  description?: string;
}

interface ReviewTransactionDialogProps {
  from: string | undefined;
  to: string | undefined;
  amount: string;
  fee: string | undefined;
  onConfirm: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

function TransactionDetailRow({ detail }: { detail: TransactionDetail }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-600">{detail.label}:</span>
      <span className="font-medium">
        {`${detail.value} ${detail.currency ?? ""}`}
      </span>
    </div>
  );
}

export const ReviewTransactionDialog = forwardRef<
  ReviewTransactionDialogHandle,
  ReviewTransactionDialogProps
>(({ from, to, amount, fee, onConfirm, onSuccess, onError }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { usdPrice } = useUsdPrice();
  const { toast } = useToast();

  useImperativeHandle(ref, () => ({
    openDialog: () => setIsOpen(true),
  }));

  const handleSubmit = () => {
    try {
      setIsSubmitting(true);
      setIsOpen(false);
      onConfirm();
      toast({
        title: "Success!",
        description: "Transaction submitted successfully",
      });
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const details = useMemo(() => {
    const amountUSD = convertTORUSToUSD(amount, usdPrice);
    const feeUSD = convertTORUSToUSD(fee ?? "0", usdPrice, false);

    const transactionDetails: TransactionDetail[] = [
      { label: "From", value: from },
      { label: "To", value: to },
      { label: "Amount", value: amount, currency: "TORUS" },
      { label: "Amount (USD)", value: amountUSD, currency: "$" },
      { label: "Network Fee", value: fee, currency: "TORUS" },
      { label: "Network Fee (USD)", value: feeUSD, currency: "$" },
    ];

    return transactionDetails;
  }, [amount, fee, from, to, usdPrice]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">
            Review Transaction
          </AlertDialogTitle>
          <div className="space-y-4">
            <div className="rounded-lg">
              {details.map((detail, index) => (
                <TransactionDetailRow key={index} detail={detail} />
              ))}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Confirm Transaction"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
