import { PermissionForm } from "./_components/permission-form";

export default function Page() {
  return (
    <main
      className="container mx-auto min-h-screen max-w-screen-xl p-4 w-full"
    >
      <div className="py-8">
        <h1 className="text-4xl font-bold mb-4 text-center">Torus Permission Builder</h1>
        <div className="max-w-3xl mx-auto mb-8 text-center text-gray-600 dark:text-gray-300">
          <p className="mb-4">
            Use this tool to build and validate permission constraints for the Torus network.
            These constraints define the conditions under which a permission can be used.
          </p>
          <p>
            You can create complex constraints using logical operators, numeric expressions, 
            and conditions based on account stakes, weight delegations, and more.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <PermissionForm />
        </div>
      </div>
    </main>
  );
}
