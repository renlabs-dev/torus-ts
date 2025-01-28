import { FilterContent } from "./components/filter-content";
import { RenderList } from "./components/render-list";
import { CreateModal } from "./components/modal";
import { PopoverInfo } from "./components/popover-info";
import { SidebarInfo } from "./components/sidebar-info";
import { SidebarLinks } from "./components/sidebar-links";

export default function HomePage(): JSX.Element {
  return (
    <main className="mb-12 flex w-full animate-fade-down flex-col gap-4 lg:flex-row">
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
        <RenderList />
      </div>
    </main>
  );
}
