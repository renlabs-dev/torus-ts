"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";

import PortalFormContainer from "~/app/_components/portal-form-container";
import PortalFormHeader from "~/app/_components/portal-form-header";

// Every single namespace name has been changed to Capability Permission
// as requested here: https://coda.io/d/RENLABS-CORE-DEVELOPMENT-DOCUMENTS_d5Vgr5OavNK/Text-change-requests_su4jQAlx
// In the future we are going to have all the other names from namespace to Capability Permission
// TODO : Change all namespace to Capability Permission

interface CreatePermissionLayoutProps {
  children: React.ReactNode;
}

export default function CreatePermissionLayout({
  children,
}: CreatePermissionLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab based on pathname
  const activeTab = pathname.includes("/emission") ? "emission" : "capability";

  const handleTabChange = (value: string) => {
    if (value === "capability") {
      router.push("/permissions/create-permission/capability");
    } else {
      router.push("/permissions/create-permission/emission");
    }
  };

  return (
    <PortalFormContainer>
      <PortalFormHeader
        title="Delegate Permission"
        description="Select the type of permission you want to delegate."
      />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="capability">Capability</TabsTrigger>
          <TabsTrigger value="emission">Emission</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {children}
        </TabsContent>
      </Tabs>
    </PortalFormContainer>
  );
}
