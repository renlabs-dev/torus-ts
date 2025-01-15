import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CadreMembersList, CadreRequestsList } from "./_components";
import { Button } from "@torus-ts/ui";

export default function CadrePage() {
  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-col py-12">
      <Button
        asChild
        variant="link"
        className="mb-6 flex w-fit items-center gap-1.5 p-0"
      >
        <Link
          href="/?view=cadre"
          className="flex animate-fade-left items-center text-white transition duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          Go back to agents list
        </Link>
      </Button>

      <div>
        <h2 className="pb-4 text-start text-xl font-semibold text-gray-300">
          Curator DAO Join Requests
        </h2>
        <CadreRequestsList />
      </div>

      <div className="w-full pb-4 pt-8 text-gray-500">
        <h2 className="text-start text-lg font-semibold text-gray-300">
          Curator DAO Members Discord Id's
        </h2>
      </div>
      <CadreMembersList />
    </div>
  );
}
