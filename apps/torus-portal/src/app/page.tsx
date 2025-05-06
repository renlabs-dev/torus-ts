import { PermissionForm } from "./_components/permission-form/permission-form";

export default function Page() {
  return (
    <main className="container mx-auto min-h-screen max-w-screen-xl p-4 w-full">
      <div className="py-8">
        <h1 className="text-4xl font-bold mb-4 text-center">
          Torus Permission Builder
        </h1>

        <div className="max-w-6xl mx-auto">
          <PermissionForm />
        </div>
      </div>
    </main>
  );
}
