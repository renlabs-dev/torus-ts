import type { Metadata } from "next";
import EditEmissionPermissionForm from "./_components/edit-emission-permission-form";
import PortalNavigationTabs from "../_components/portal-navigation-tabs";

export const metadata: Metadata = {
  title: "Edit Permission | Torus Portal",
  description: "Edit existing emission permissions on the Torus Network",
};

export default function EditPermissionPage() {
  return (
    <main className="container mx-auto py-8 pt-36">
      <div className="fixed top-[3.9rem] left-2 right-96 z-10">
        <PortalNavigationTabs />
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Permission</h1>
          <p className="text-muted-foreground mt-2">
            Modify existing emission permissions you have access to edit.
          </p>
        </div>
        <EditEmissionPermissionForm />
      </div>
    </main>
  );
}
