"use client";

import { useState } from "react";

import { AlertTriangle } from "lucide-react";

import { Button } from "@torus-ts/ui/components/button";
import { Checkbox } from "@torus-ts/ui/components/checkbox";
import { DestructiveAlertWithDescription } from "@torus-ts/ui/components/destructive-alert-with-description";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { Separator } from "@torus-ts/ui/components/separator";

interface DeregisterAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  onConfirm: () => void;
  isDeregistering: boolean;
}

export function DeregisterAgentDialog({
  open,
  onOpenChange,
  agentName,
  onConfirm,
  isDeregistering,
}: DeregisterAgentDialogProps) {
  const [confirmationChecks, setConfirmationChecks] = useState({
    permanent: false,
    revokedPermissions: false,
    backedUpData: false,
    newAgent: false,
  });
  const [confirmationText, setConfirmationText] = useState("");

  const allChecksConfirmed = Object.values(confirmationChecks).every(Boolean);
  const nameMatches = confirmationText.trim() === agentName;
  const canProceed = allChecksConfirmed && nameMatches && !isDeregistering;

  const handleConfirmationChange = (key: keyof typeof confirmationChecks) => {
    setConfirmationChecks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !isDeregistering) {
      // Reset state when dialog closes
      setConfirmationChecks({
        permanent: false,
        revokedPermissions: false,
        backedUpData: false,
        newAgent: false,
      });
      setConfirmationText("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle className="text-lg">Agent de-registration</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            This action cannot be undone and will immediately deregister your
            agent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <DestructiveAlertWithDescription
            title="Permissions Warning"
            description="You can only deregister if you have NO active namespace permissions being delegated. You must manually revoke all delegated permissions first."
          />

          <div>
            <h4 className="mb-3">You will permanently lose:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-destructive font-bold">•</span>
                <span>
                  <strong>All registered namespaces</strong> — all capability
                  paths will be deleted
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive font-bold">•</span>
                <span>
                  <strong>
                    Ability to create new namespace or emission delegations
                  </strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive font-bold">•</span>
                <span>
                  <strong>Delegated permissions</strong> — all permissions
                  granted to/from your agent will be revoked
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive font-bold">•</span>
                <span>
                  <strong>Agent name</strong> — you CAN reuse this name if you
                  re-register later
                </span>
              </li>
            </ul>
          </div>

          <p className="text-sm">
            <strong>Note:</strong> You will continue receiving emissions from
            existing delegations until the delegator revokes those permissions.
          </p>

          <Separator />

          <div>
            <h4 className="mb-4">Before proceeding, confirm you understand:</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="permanent"
                  className="mt-1"
                  checked={confirmationChecks.permanent}
                  onCheckedChange={() => handleConfirmationChange("permanent")}
                />
                <Label htmlFor="permanent" className="text-sm leading-relaxed">
                  This action is permanent and irreversible
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="revokedPermissions"
                  className="mt-1"
                  checked={confirmationChecks.revokedPermissions}
                  onCheckedChange={() =>
                    handleConfirmationChange("revokedPermissions")
                  }
                />
                <Label
                  htmlFor="revokedPermissions"
                  className="text-sm leading-relaxed"
                >
                  I have manually revoked ALL delegated namespace permissions
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="backedUpData"
                  className="mt-1"
                  checked={confirmationChecks.backedUpData}
                  onCheckedChange={() =>
                    handleConfirmationChange("backedUpData")
                  }
                />
                <Label
                  htmlFor="backedUpData"
                  className="text-sm leading-relaxed"
                >
                  I have backed up any important data or configurations
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="newAgent"
                  className="mt-1"
                  checked={confirmationChecks.newAgent}
                  onCheckedChange={() => handleConfirmationChange("newAgent")}
                />
                <Label htmlFor="newAgent" className="text-sm leading-relaxed">
                  I understand I can re-register with the same name later, but
                  it will be treated as a completely new agent
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmationText" className="text-sm font-semibold">
              Type your agent name "{agentName}" below to confirm deletion:
            </Label>
            <Input
              id="confirmationText"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={agentName}
              className="mt-2"
              disabled={isDeregistering}
            />
          </div>

          <div className="rounded-md border border-destructive bg-destructive/10 p-4">
            <p className="text-sm font-semibold text-destructive text-center">
              This is your final warning. Once deleted, your agent cannot be
              restored.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => handleDialogClose(false)}
            disabled={isDeregistering}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!canProceed}
          >
            {isDeregistering ? "DELETING..." : "DELETE AGENT PERMANENTLY"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
