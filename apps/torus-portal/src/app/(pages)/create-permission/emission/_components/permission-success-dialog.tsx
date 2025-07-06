import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@torus-ts/ui/components/alert-dialog";

interface PermissionSuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function PermissionSuccessDialog({
  isOpen,
  onOpenChange,
  onClose,
}: PermissionSuccessDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Permission Created Successfully!</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="py-4">
          <p className="mb-4">
            Your emission permission has been granted successfully.
            {/* Your emission permission has been granted successfully. Now you can
            create constraints to define specific rules and conditions for this
            permission. */}
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <AlertDialogAction
            onClick={onClose}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Got it!
            {/* I'll do that later */}
          </AlertDialogAction>
          {/* <Link href="/create-constraint">
            <AlertDialogAction className="bg-green-600 text-white hover:bg-green-700">
              Create a Constraint →
            </AlertDialogAction>
          </Link> */}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
