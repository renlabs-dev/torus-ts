import FilterDaoContent from "./_components/cadre/components/dao-members-candidates-filter";
import { FilterContent } from "./_components/filter-content";
import { CreateModal } from "./_components/modal";
import { PopoverInfo } from "./_components/popover-info";
import { RenderList } from "./_components/render-list";
import { SidebarInfo } from "./_components/sidebar-info";
import { SidebarLinks } from "./_components/sidebar-links";

export default function HomePage() {
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
          <FilterDaoContent />
          <CreateModal />
        </div>
        <RenderList />
      </div>
    </main>
  );
}
