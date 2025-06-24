"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import { Button } from "@torus-ts/ui/components/button";
import { CheckCircle } from "lucide-react";

interface NamespaceSuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function NamespaceSuccessDialog({
  isOpen,
  onOpenChange,
  onClose,
}: NamespaceSuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">
            Namespace Created Successfully!
          </DialogTitle>
          <DialogDescription className="text-center">
            Your namespace has been created on the Torus Network. Agents can
            now use this namespace to handle API requests.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-6">
          <Button onClick={onClose} className="px-8">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}