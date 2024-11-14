
// import { Container } from "@torus-ts/ui";
import { ListCards } from "./components/list-cards";
import { CreateModal } from "./components/modal";
import { Sidebar } from "./components/sidebar";

export default function HomePage(): JSX.Element {
  return (
    <main className="flex w-full flex-col items-center justify-center px-6">
      <div className="h-full w-full pt-12 ">
        {/* <Container> */}
        <div className="mx-auto flex w-full max-w-screen-xl animate-fade-in-down flex-col items-center justify-center text-white">
          <div className="flex w-full justify-center gap-4 pb-12 pt-24">
            <Sidebar />
            <div className="w-full gap-6 flex flex-col">
              <CreateModal />
              <ListCards />
            </div>
          </div>
        </div>
        {/* </Container> */}
      </div>
    </main>
  );
}
