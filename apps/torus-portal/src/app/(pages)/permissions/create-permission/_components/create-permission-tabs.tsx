"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { usePathname, useRouter } from "next/navigation";

interface CreatePermissionTabsProps {
  children: React.ReactNode;
}

export function CreatePermissionTabs({ children }: CreatePermissionTabsProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab based on pathname
  const activeTab = pathname.includes("/stream") ? "stream" : "capability";

  const handleTabChange = (value: string) => {
    if (value === "capability") {
      router.push("/permissions/create-permission/capability");
    } else {
      router.push("/permissions/create-permission/stream");
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="capability">Capability</TabsTrigger>
        <TabsTrigger value="stream">Stream</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="mt-6">
        {children}
      </TabsContent>
    </Tabs>
  );
}
