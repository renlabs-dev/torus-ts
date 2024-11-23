// import { Container } from "@torus-ts/ui";

import { FilterContent } from "./components/filter-content";
import { ListCards } from "./components/list-cards";
import { CreateModal } from "./components/modal";
import { PopoverInfo } from "./components/popover-info";
import { SidebarInfo } from "./components/sidebar-info";
import { SidebarLinks } from "./components/sidebar-links";

export default function HomePage(): JSX.Element {
  return (
    <main className="flex w-full flex-col items-center justify-center px-4 md:px-6">
      <div className="h-full w-full pt-12">
        {/* <Container> */}
        <div className="mx-auto flex w-full max-w-screen-xl animate-fade-in-down flex-col items-center justify-center text-white">
          <div className="flex w-full flex-col justify-center gap-4 pb-12 pt-24 md:flex-row">
            <div className="flex w-full flex-col gap-4 md:max-w-[300px]">
              <div className="flex w-full gap-4">
                <SidebarLinks />
                <PopoverInfo />
              </div>
              <SidebarInfo />
            </div>
            <div className="flex w-full flex-col gap-6">
              <div className="flex w-full justify-between">
                <CreateModal />
                <FilterContent />
              </div>
              <ListCards />
            </div>
          </div>
        </div>
        {/* </Container> */}
      </div>
    </main>
  );
}
