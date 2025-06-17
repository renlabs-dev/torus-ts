"use client";

import { useState } from "react";
import PortalNavigationTabs from "../_components/portal-navigation-tabs";
import GrantEmissionPermissionForm from "./_components/grant-emission-permission-form";
import { PermissionSuccessDialog } from "./_components/permission-success-dialog";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import Image from "next/image";

export default function Page() {
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  return (
    <main className="flex min-h-svh">
      <div className="fixed top-[3.9rem] left-2 right-96 z-10">
        <PortalNavigationTabs />
      </div>
      <div className="relative bg-card hidden lg:block w-[60%] animate-fade-down animate-delay-300">
        <Image
          src="/form-bg-signal.svg"
          alt="Abstract decorative background illustrating emission permissions"
          fill // lets the image automatically size to parent
          priority // avoids layout shift on first paint (optional)
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 bg-card animate-fade-down">
        <ScrollArea className="flex-1 h-svh">
          <div className="flex items-center justify-center pt-16">
            <GrantEmissionPermissionForm
              onSuccess={() => setIsSuccessDialogOpen(true)}
            />
          </div>
        </ScrollArea>
      </div>

      <PermissionSuccessDialog
        isOpen={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
      />
    </main>
  );
}
