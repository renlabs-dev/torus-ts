import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { CreateEmissionPermissionForm } from "./_components/create-emission-permission-form";

export const metadata = createSeoMetadata({
  title: "Create Emission Permission - Torus Portal",
  description: "Create emission permissions to control token distribution and rewards on the Torus Network. Manage network incentives and allocations.",
  keywords: ["emission permission", "token distribution", "network rewards", "permission management", "token allocation"],
  ogSiteName: "Torus Portal",
  canonical: "/permissions/create-permission/emission",
  baseUrl: env("BASE_URL"),
});

export default function CreateEmissionPermissionPage() {
  return <CreateEmissionPermissionForm />;
}
