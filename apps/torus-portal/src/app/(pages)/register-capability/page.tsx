"use client";

import { useState } from "react";

import CreateNamespaceForm from "./_components/create-namespace-form";
import { NamespaceSuccessDialog } from "./_components/namespace-success-dialog";
import PortalFormContainer from "~/app/_components/portal-form-container";

export default function Page() {
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  return (
    <>
<<<<<<<< HEAD:apps/torus-portal/src/app/(pages)/register-capability/page.tsx
      <PortalFormContainer imageSrc="/form-bg-register-capability.svg">
========
      <PortalFormContainer imageSrc="/form-bg-create-capability.svg">
>>>>>>>> 7cc951f2 (Fix: change all labels to replace namespace with capability (#281)):apps/torus-portal/src/app/(pages)/create-capability/page.tsx
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
