"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import { ArrowRight } from "lucide-react";

interface QuickSendEvmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  evmBalance: bigint;
  nativeBalance: bigint;
  baseBalance: bigint;
  onSendToNative: () => void;
  onSendToBase: () => void;
  formatAmount: (amount: bigint) => string;
  isTransferInProgress: boolean;
}

export function QuickSendEvmDialog({
  isOpen,
  onClose,
  evmBalance,
  nativeBalance,
  baseBalance,
  onSendToNative,
  onSendToBase,
  formatAmount,
  isTransferInProgress,
}: QuickSendEvmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Send: Torus EVM Balance</DialogTitle>
          <DialogDescription>
            Send all your Torus EVM balance to Base or Native chain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-muted-foreground mb-1 text-xs">
              Available to Send
            </div>
            <div className="text-2xl font-bold">
              {formatAmount(evmBalance)} TORUS
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              (0.005 TORUS reserved for gas fees)
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">Choose destination:</p>

            <Button
              onClick={onSendToNative}
              disabled={isTransferInProgress}
              variant="outline"
              className="h-auto w-full justify-between p-4"
            >
              <div className="text-left">
                <div className="font-semibold">Send to Torus Native</div>
                <div className="text-muted-foreground text-xs">
                  Current balance: {formatAmount(nativeBalance)} TORUS
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0" />
            </Button>

            <Button
              onClick={onSendToBase}
              disabled={isTransferInProgress}
              variant="outline"
              className="h-auto w-full justify-between p-4"
            >
              <div className="text-left">
                <div className="font-semibold">Send to Base</div>
                <div className="text-muted-foreground text-xs">
                  Current balance: {formatAmount(baseBalance)} TORUS
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0" />
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            onClick={onClose}
            variant="ghost"
            disabled={isTransferInProgress}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
