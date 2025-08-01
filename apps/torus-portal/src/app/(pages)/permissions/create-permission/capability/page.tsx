import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { CreateCapabilityPermissionForm } from "./_components/create-capability-permission-form";

export const metadata = createSeoMetadata({
  title: "Create Capability Permission - Torus Portal",
  description: "Create capability-based permissions for agents on the Torus Network. Define specific access rights and operational permissions.",
  keywords: ["capability permission", "agent capabilities", "permission creation", "access rights", "operational permissions"],
  ogSiteName: "Torus Portal",
  canonical: "/permissions/create-permission/capability",
  baseUrl: env("BASE_URL"),
});

export default function CreateCapabilityPermissionPage() {
  return <CreateCapabilityPermissionForm />;
}
