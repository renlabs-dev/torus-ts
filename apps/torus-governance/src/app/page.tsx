import { FilterContent } from "./components/filter-content";
import { CreateModal } from "./components/modal";
import { PopoverInfo } from "./components/popover-info";
import { RenderList } from "./components/render-list";
import { SidebarInfo } from "./components/sidebar-info";
import { SidebarLinks } from "./components/sidebar-links";

export default function HomePage(): JSX.Element {
  return (
    <main className="animate-fade-down mb-6 flex w-full flex-col gap-4 lg:flex-row">
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
