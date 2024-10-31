import { CreateModal } from "./modal";

export function FooterDivider(): JSX.Element {
  return (
    <div className="mx-auto mb-14 w-full">
      <div className="flex w-full flex-col justify-between text-left lg:flex-row lg:items-center">
        <div className="flex w-full flex-col py-6">
          <p className="font-medium text-gray-400">Want to change something?</p>
          <h2 className="text-3xl font-medium text-white lg:text-5xl">
            Create a new
            <span className="font-thin text-green-500"> proposal</span>
          </h2>
        </div>
        <div className="w-full lg:w-1/4">
          <CreateModal />
        </div>
      </div>
    </div>
  );
}
