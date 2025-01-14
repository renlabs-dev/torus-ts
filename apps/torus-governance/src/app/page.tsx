import { FilterContent } from "./components/filter-content";
import { ListCards } from "./components/list-cards";
import { CreateModal } from "./components/modal";
import { PopoverInfo } from "./components/popover-info";
import { SidebarInfo } from "./components/sidebar-info";
import { SidebarLinks } from "./components/sidebar-links";

export default function HomePage(): JSX.Element {
  return (
    <main className="flex w-full animate-fade-down flex-col gap-4 py-6 lg:flex-row lg:py-10">
      <div className="flex w-full flex-col gap-4 lg:w-2/5 lg:max-w-[320px]">
        <div className="flex w-full gap-4">
          <SidebarLinks />
          <PopoverInfo />
        </div>
        <SidebarInfo />
      </div>
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full flex-col justify-between gap-3 lg:flex-row">
          <FilterContent />
          <CreateModal />
        </div>
        <ListCards />
      </div>
    </main>
  );
}
