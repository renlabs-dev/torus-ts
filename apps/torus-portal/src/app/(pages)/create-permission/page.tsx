"use client";

import { useState } from "react";

import GrantEmissionPermissionForm from "./_components/grant-emission-permission-form";
import { PermissionSuccessDialog } from "./_components/permission-success-dialog";
import PortalFormLayout from "~/app/_components/portal-form-layout";

export default function Page() {
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  return (
    <>
      <PortalFormLayout
        imageSrc="/form-bg-permission.svg"
        imageAlt="Abstract decorative background illustrating emission permissions"
      >
        <GrantEmissionPermissionForm
          onSuccess={() => setIsSuccessDialogOpen(true)}
        />
      </PortalFormLayout>

      <PermissionSuccessDialog
        isOpen={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
      />
    </>
  );
}
