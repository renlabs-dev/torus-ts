"use client";

import { useState } from "react";
import PortalNavigationTabs from "../_components/portal-navigation-tabs";
import GrantEmissionPermissionForm from "./_components/grant-emission-permission-form";
import { PermissionSuccessDialog } from "./_components/permission-success-dialog";
import Image from "next/image";

export default function Page() {
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  return (
    <div className="flex min-h-svh">
      <div className="fixed top-[3.9rem] left-2 right-96 z-10">
        <PortalNavigationTabs />
      </div>
      <div className="relative bg-card hidden lg:block w-[60%] animate-fade-down animate-delay-300">
        <Image
          width={100}
          height={100}
          src="/form-bg-signal.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 items-center py-16 justify-center bg-card animate-fade-down">
        <GrantEmissionPermissionForm
          onSuccess={() => setIsSuccessDialogOpen(true)}
        />
      </div>

      <PermissionSuccessDialog
        isOpen={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
      />
    </div>
  );
}
