"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";

import PortalFormContainer from "~/app/_components/portal-form-container";

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
      router.push("/create-permission");
    } else {
      router.push("/create-permission/emission");
    }
  };

  return (
    <PortalFormContainer imageSrc="/form-bg-permission.svg">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full mx-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="capability">Capability Permission</TabsTrigger>
          <TabsTrigger value="emission">Emission Permission</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {children}
        </TabsContent>
      </Tabs>
    </PortalFormContainer>
  );
}
