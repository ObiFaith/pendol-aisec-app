import { ArrowDownUp } from "lucide-react";
import type { PageFilter } from "../../types/vendor";

type PageFilterTabsProps = {
  currentFilter: PageFilter;
  onFilterChange: (filter: PageFilter) => void;
  resultCount: number;
};

const FILTERS: PageFilter[] = ["all", "1", "2"];

export function PageFilterTabs({
  currentFilter,
  onFilterChange,
  resultCount,
}: PageFilterTabsProps) {
  return (
    <div className="list-toolbar">
      <div
        className="page-tabs"
        role="group"
        aria-label="Filter by source page"
      >
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={currentFilter === filter ? "active" : ""}
            onClick={() => onFilterChange(filter)}
          >
            {filter === "all" ? "All" : `Page ${filter}`}
          </button>
        ))}
      </div>
      <span className="result-count">
        {resultCount} RESULTS <ArrowDownUp size={11} />
      </span>
    </div>
  );
}
