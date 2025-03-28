import FilterDaoContent from "../../_components/cadre/components/dao-members-candidates-filter";
import { CadreCandidate } from "../../_components/render-list/list-cadre-candidates";

export default function DaoPortalPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col justify-between gap-3 lg:flex-row">
        <FilterDaoContent />
      </div>
      <CadreCandidate />
    </div>
  );
}
