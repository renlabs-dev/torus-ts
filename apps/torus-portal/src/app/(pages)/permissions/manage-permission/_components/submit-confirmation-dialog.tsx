import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";

export interface ChangeDetail {
  type: 'added' | 'modified' | 'removed' | 'unchanged';
  field: string;
  description: string;
  oldValue?: string;
  newValue?: string;
}

interface SubmitConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  changes: ChangeDetail[];
}

export function SubmitConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  changes,
}: SubmitConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Permission Changes</DialogTitle>
          <DialogDescription>
            You are about to update the following fields:
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ul className="space-y-3">
            {changes.map((change, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                  change.type === 'added' ? 'bg-green-500' :
                  change.type === 'modified' ? 'bg-blue-500' :
                  change.type === 'removed' ? 'bg-red-500' :
                  'bg-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="font-medium text-white">{change.description}</div>
                  {change.oldValue && change.newValue && (
                    <div className="text-xs text-white mt-1">
                      From: <span className="font-mono bg-gray-700 px-1 rounded text-white">{change.oldValue}</span> → 
                      To: <span className="font-mono bg-gray-700 px-1 rounded text-white">{change.newValue}</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Continue Editing
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1"
          >
            Confirm Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}