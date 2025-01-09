import { FilterContent } from "./components/filter-content";
import { ListCards } from "./components/list-cards";
import { CreateModal } from "./components/modal";
import { PopoverInfo } from "./components/popover-info";
import { SidebarInfo } from "./components/sidebar-info";
import { SidebarLinks } from "./components/sidebar-links";

export default function HomePage(): JSX.Element {
  return (
    <main className="p flex w-full animate-fade-down flex-col justify-center gap-4 py-12 md:flex-row">
      <div className="flex w-full flex-col gap-4 md:max-w-[300px]">
        <div className="flex w-full gap-4">
          <SidebarLinks />
          <PopoverInfo />
        </div>
        <SidebarInfo />
      </div>
      <div className="flex w-full flex-col gap-6">
        <div className="flex w-full justify-between">
          <FilterContent />
          <CreateModal />
        </div>
        <ListCards />
      </div>
    </main>
  );
}
