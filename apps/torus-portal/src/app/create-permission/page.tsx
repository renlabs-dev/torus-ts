"use client";

import { useState } from "react";
import PortalNavigationTabs from "../_components/portal-navigation-tabs";
import GrantEmissionPermissionForm from "./_components/grant-emission-permission-form";
import { PermissionSuccessDialog } from "./_components/permission-success-dialog";

export default function Page() {
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  return (
    <main className="min-h-screen overflow-auto bg-background">
      <div className="fixed top-[3.9rem] left-2 right-96 z-10">
        <PortalNavigationTabs />
      </div>
      <div className="pt-24 pb-12">
        <GrantEmissionPermissionForm
          onSuccess={() => setIsSuccessDialogOpen(true)}
        />
      </div>

      <PermissionSuccessDialog
        isOpen={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
      />
    </main>
  );
}
