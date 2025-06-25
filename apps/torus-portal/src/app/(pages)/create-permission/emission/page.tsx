"use client";

import { useState } from "react";
import GrantEmissionPermissionForm from "./_components/grant-emission-permission-form";
import { PermissionSuccessDialog } from "./_components/permission-success-dialog";

export default function EmissionPermissionPage() {
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  return (
    <>
      <GrantEmissionPermissionForm
        onSuccess={() => setIsSuccessDialogOpen(true)}
      />

      <PermissionSuccessDialog
        isOpen={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
      />
    </>
  );
}
