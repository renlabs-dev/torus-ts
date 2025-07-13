"use client";

import { useState } from "react";

import PortalFormContainer from "~/app/_components/portal-form-container";

import CreateNamespaceForm from "./_components/create-namespace-form";
import { NamespaceSuccessDialog } from "./_components/namespace-success-dialog";

export default function Page() {
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  return (
    <>
      <PortalFormContainer>
        <CreateNamespaceForm onSuccess={() => setIsSuccessDialogOpen(true)} />
      </PortalFormContainer>

      <NamespaceSuccessDialog
        isOpen={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
      />
    </>
  );
}
