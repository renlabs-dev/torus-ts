"use client";

import { useState } from "react";

import CreateNamespaceForm from "./_components/create-namespace-form";
import { NamespaceSuccessDialog } from "./_components/namespace-success-dialog";
import PortalFormContainer from "~/app/_components/portal-form-container";

export default function Page() {
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  return (
    <>
      <PortalFormContainer imageSrc="/form-bg-create-capability.svg">
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
