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

// Every single namespace name has been changed to Capability Permission
// as requested here: https://coda.io/d/RENLABS-CORE-DEVELOPMENT-DOCUMENTS_d5Vgr5OavNK/Text-change-requests_su4jQAlx
// In the future we are going to have all the other names from namespace to Capability Permission
// TODO : Change all namespace to Capability Permission

interface NamespaceSuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

// Every single namespace name has been changed to Capability Permission
// as requested here: https://coda.io/d/RENLABS-CORE-DEVELOPMENT-DOCUMENTS_d5Vgr5OavNK/Text-change-requests_su4jQAlx
// In the future we are going to have all the other names from namespace to Capability Permission
// TODO : Change all namespace to Capability Permission

export function NamespaceSuccessDialog({
  isOpen,
  onOpenChange,
  onClose,
}: NamespaceSuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div
            className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100
              rounded-full"
          >
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">
            Capability Permission Created Successfully!
          </DialogTitle>
          <DialogDescription className="text-center">
            Your capability permission has been created on the Torus Network.
            Agents can now use this capability permission to handle API
            requests.
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
